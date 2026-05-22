<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CustomerSearchService
{
    public function search(array $params): LengthAwarePaginator
    {
        $q       = trim($params['q']);
        $tokens  = preg_split('/\s+/', $q, -1, PREG_SPLIT_NO_EMPTY);
        $perPage = min((int) ($params['per_page'] ?? 25), 100);
        $page    = max((int) ($params['page'] ?? 1), 1);

        $query = Customer::query()
            ->select('customer_profile.*')
            ->selectRaw('(' . $this->scoreSql($q, $tokens) . ') AS relevance_score')
            ->selectRaw('(' . $this->matchedFieldsSql($q, $tokens) . ') AS matched_fields_raw');

        // Candidate retrieval — name/email/tel prefix + SOUNDEX fuzzy only.
        // Address is intentionally excluded here: a substring match on address
        // (e.g. "Frontvägen" matching "ron") retrieves completely unrelated records.
        // Address is still used in the scoring CASE (+30) for candidates found via other fields.
        $query->where(function ($w) use ($tokens) {
            foreach ($tokens as $token) {
                $like = $token . '%';
                $w->orWhereRaw('first_name LIKE ?', [$like])
                  ->orWhereRaw('last_name  LIKE ?', [$like])
                  ->orWhereRaw('email      LIKE ?', [$like])
                  ->orWhereRaw('tel        LIKE ?', [$like])
                  ->orWhereRaw('pers_nr    LIKE ?', [$like]);
            }

        })
        ->havingRaw('relevance_score > 0');

        if (!empty($params['status'])) {
            $query->whereIn('status', (array) $params['status']);
        }
        if (!empty($params['last_order_after'])) {
            $query->whereRaw('last_order >= ?', [$params['last_order_after']]);
        }
        if (!empty($params['last_order_before'])) {
            $query->whereRaw('last_order <= ?', [$params['last_order_before']]);
        }

        return $query
            ->orderByDesc('relevance_score')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    // ── Scoring SQL ──────────────────────────────────────────────────────────

    private function scoreSql(string $q, array $tokens): string
    {
        $bindings = [];
        $cases    = [];

        if (count($tokens) >= 2) {
            [$t0, $t1] = [$tokens[0], $tokens[1]];

            $cases[]    = "WHEN CONCAT(first_name, ' ', last_name) LIKE ? THEN 100";
            $bindings[] = $q . '%';

            $cases[]    = 'WHEN first_name LIKE ? AND last_name LIKE ? THEN 90';
            $bindings[] = $t0 . '%';
            $bindings[] = $t1 . '%';

            $cases[]    = 'WHEN first_name LIKE ? AND last_name LIKE ? THEN 85';
            $bindings[] = $t1 . '%';
            $bindings[] = $t0 . '%';

            $allConds = array_fill(0, count($tokens), '(first_name LIKE ? OR last_name LIKE ?)');
            $cases[]  = 'WHEN ' . implode(' AND ', $allConds) . ' THEN 70';
            foreach ($tokens as $t) {
                $bindings[] = $t . '%';
                $bindings[] = $t . '%';
            }
        }

        // Single-token name scoring — must come before email/tel so name matches rank first.
        if (count($tokens) === 1) {
            $cases[]    = 'WHEN first_name LIKE ? THEN 90';
            $bindings[] = $tokens[0] . '%';

            $cases[]    = 'WHEN last_name LIKE ? THEN 80';
            $bindings[] = $tokens[0] . '%';
        }

        $cases[]    = 'WHEN pers_nr LIKE ? THEN 65';
        $bindings[] = $q . '%';

        $cases[]    = 'WHEN email LIKE ? THEN 60';
        $bindings[] = $q . '%';

        $cases[]    = 'WHEN tel LIKE ? THEN 50';
        $bindings[] = $q . '%';

        $cases[]    = 'WHEN adress LIKE ? THEN 30';
        $bindings[] = '%' . $q . '%';

        return $this->bind('CASE ' . implode(' ', $cases) . ' ELSE 0 END', $bindings);
    }

    // ── Matched fields SQL ───────────────────────────────────────────────────

    private function matchedFieldsSql(string $q, array $tokens): string
    {
        $parts    = [];
        $bindings = [];

        foreach ($tokens as $t) {
            $parts[]    = "(CASE WHEN first_name LIKE ? OR last_name LIKE ? THEN 'name,' ELSE '' END)";
            $bindings[] = $t . '%';
            $bindings[] = $t . '%';
        }

        $parts[]    = "(CASE WHEN pers_nr LIKE ? THEN 'ssn,' ELSE '' END)";
        $bindings[] = $q . '%';

        $parts[]    = "(CASE WHEN email LIKE ? THEN 'email,' ELSE '' END)";
        $bindings[] = $q . '%';

        $parts[]    = "(CASE WHEN tel LIKE ? THEN 'phone,' ELSE '' END)";
        $bindings[] = $q . '%';

        $parts[]    = "(CASE WHEN adress LIKE ? THEN 'address,' ELSE '' END)";
        $bindings[] = '%' . $q . '%';

        return $this->bind('CONCAT(' . implode(', ', $parts) . ')', $bindings);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function bind(string $sql, array $bindings): string
    {
        foreach ($bindings as $binding) {
            $escaped = "'" . addslashes((string) $binding) . "'";
            $sql     = preg_replace('/\?/', $escaped, $sql, 1);
        }

        return $sql;
    }
}
