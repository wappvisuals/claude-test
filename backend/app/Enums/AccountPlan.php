<?php

namespace App\Enums;

/**
 * Sinfrid account plans. Ported from the legacy Sinfrid integration — plan ids
 * 1-8 map to demo/live tiers (Single / Duo / Family / Business).
 */
enum AccountPlan: string
{
    case DemoSingle = 'Demo Plan Single';
    case DemoDuo = 'Demo Plan Duo';
    case DemoFamily = 'Demo Plan Family';
    case DemoBusiness = 'Demo Plan Business';
    case Single = 'id-protect-single';
    case Duo = 'id-protect-duo';
    case Family = 'id-protect-family';
    case Business = 'id-protect-business';

    private const PLAN_MAPPING = [
        1 => self::DemoSingle,
        2 => self::DemoDuo,
        3 => self::DemoFamily,
        4 => self::DemoBusiness,
        5 => self::Single,
        6 => self::Duo,
        7 => self::Family,
        8 => self::Business,
    ];

    public static function getPlanTypeById(int $planId): ?string
    {
        return self::PLAN_MAPPING[$planId]->value ?? null;
    }

    public static function getCategory(string $plan): ?string
    {
        return match ($plan) {
            self::DemoSingle->value, self::Single->value => 'SINGLE',
            self::DemoDuo->value, self::Duo->value,
            self::DemoFamily->value, self::Family->value => 'FAMILY',
            self::DemoBusiness->value, self::Business->value => 'BUSINESS',
            default => null,
        };
    }

    public static function getCategoryById(int $planId): ?string
    {
        $plan = self::getPlanTypeById($planId);

        return $plan ? self::getCategory($plan) : null;
    }

    public static function getMaxMembersCount(string $plan): ?int
    {
        return match ($plan) {
            self::DemoSingle->value, self::Single->value => 1,
            self::DemoDuo->value, self::Duo->value => 2,
            self::DemoFamily->value, self::DemoBusiness->value,
            self::Family->value, self::Business->value => 5,
            default => null,
        };
    }

    public static function isValidId(int $planId): bool
    {
        return isset(self::PLAN_MAPPING[$planId]);
    }

    public static function isUpgrade(int $currentPlanId, int $newPlanId): bool
    {
        return $newPlanId > $currentPlanId;
    }

    /** @return array<int, array{id: int, plan: string, label: string, category: string|null, max_members: int|null}> */
    public static function options(): array
    {
        $labels = [
            self::DemoSingle->value => 'Demo · Single',
            self::DemoDuo->value => 'Demo · Duo',
            self::DemoFamily->value => 'Demo · Family',
            self::DemoBusiness->value => 'Demo · Business',
            self::Single->value => 'Single',
            self::Duo->value => 'Duo',
            self::Family->value => 'Family',
            self::Business->value => 'Business',
        ];

        $out = [];
        foreach (self::PLAN_MAPPING as $id => $plan) {
            $out[] = [
                'id' => $id,
                'plan' => $plan->value,
                'label' => $labels[$plan->value],
                'category' => self::getCategory($plan->value),
                'max_members' => self::getMaxMembersCount($plan->value),
            ];
        }

        return $out;
    }
}
