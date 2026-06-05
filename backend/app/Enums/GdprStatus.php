<?php

namespace App\Enums;

enum GdprStatus: string
{
    case Flagged = 'flagged';
    case PendingReview = 'pending_review';
    case Anonymized = 'anonymized';
    case Restored = 'restored';
    case Rejected = 'rejected';

    /** @return string[] */
    public static function all(): array
    {
        return array_map(static fn (self $s) => $s->value, self::cases());
    }

    /** Statuses that block further GDPR flag changes. */
    public function isLocked(): bool
    {
        return in_array($this, [self::PendingReview, self::Anonymized], true);
    }

    public function is(GdprStatus $status): bool
    {
        return $this === $status;
    }

    public function label(): string
    {
        return match ($this) {
            self::Flagged => 'Flagged',
            self::PendingReview => 'Pending Review',
            self::Anonymized => 'Anonymized',
            self::Restored => 'Restored',
            self::Rejected => 'Rejected',
        };
    }
}
