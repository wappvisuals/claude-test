<?php

namespace App\Enums;

enum GdprExclusionType: string
{
    case TwoYearsAfterStarter = '2y_after_starter';
    case SubscriptionEnd = 'subscription_end';

    /** @return string[] */
    public static function all(): array
    {
        return array_map(static fn (self $t) => $t->value, self::cases());
    }

    public function description(): string
    {
        return match ($this) {
            self::TwoYearsAfterStarter => 'Disable 2 years after last 1xx purchase',
            self::SubscriptionEnd => 'When the subscription ends (passive customer status 1 month after all brands become inactive)',
        };
    }

    /** @return array<int, array{type: string, description: string}> */
    public static function options(): array
    {
        return array_map(
            static fn (self $t) => ['type' => $t->value, 'description' => $t->description()],
            self::cases()
        );
    }
}
