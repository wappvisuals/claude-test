<?php

namespace App\Services;

use App\Models\BlockedSsn;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use RuntimeException;

class BlockedSsnService
{
    public function getList(array $params): LengthAwarePaginator
    {
        $perPage = min((int) ($params['per_page'] ?? 25), 100);
        $query = BlockedSsn::query()->with('addedBy')->latest('created_at');

        if (!empty($params['q'])) {
            $term = '%' . $params['q'] . '%';
            $query->where(function ($w) use ($term) {
                $w->where('ssn', 'like', $term)->orWhere('reason', 'like', $term);
            });
        }

        return $query->paginate($perPage);
    }

    public function block(string $ssn, ?string $reason): BlockedSsn
    {
        if (BlockedSsn::isBlocked($ssn)) {
            throw new RuntimeException('SSN is already blocked.');
        }

        $record = BlockedSsn::create([
            'ssn' => $ssn,
            'reason' => $reason,
        ]);

        return $record->load('addedBy');
    }

    public function unblock(int $id): void
    {
        BlockedSsn::query()->findOrFail($id)->delete();
    }

    public function unblockBySsn(string $ssn): void
    {
        BlockedSsn::query()->where('ssn', $ssn)->delete();
    }
}
