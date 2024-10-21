/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { ITelemetry } from '@msdyn365-commerce/core';
import { AttributeDataType, DisplayTemplate, ProductRefinerValue, RefinerType } from '@msdyn365-commerce/retail-proxy';

import { IProductRefinerHierarchy } from '@msdyn365-commerce/commerce-entities';
import { DimensionTypes } from '@msdyn365-commerce-modules/retail-actions';
import { IRefineItemToggleNotification } from './refine-item-toggle-notification';

/**
 * Types of product refiner values.
 * @deprecated This will be removed soon. Please, use `AttributeDataType` from `@msdyn365-commerce/retail-proxy` instead.
 * @example
 * ```
 * import { AttributeDataType } from `@msdyn365-commerce/retail-proxy`;
 * ```
 */
export enum ProductRefinerValueDataTypeValue {
    /**
     * Range slider is used for selections like price.
     * @deprecated This will be removed soon. Please, use `AttributeDataType` from `@msdyn365-commerce/retail-proxy` instead.
     * @example
     * ```
     * import { AttributeDataType } from `@msdyn365-commerce/retail-proxy`;
     * ```
     */
    Range = 1,

    /**
     * Range input is a different way to specify ranges and can be expressed with input boxes
     * as well as a set of discrete single-select type values.
     * @deprecated This will be removed soon. Please, use `AttributeDataType` from `@msdyn365-commerce/retail-proxy` instead.
     * @example
     * ```
     * import { AttributeDataType } from `@msdyn365-commerce/retail-proxy`;
     * ```
     */
    RangeInput = 4,

    /**
     * This is a discrete list item, either multi-select or single-select.
     * @deprecated This will be removed soon. Please, use `AttributeDataType` from `@msdyn365-commerce/retail-proxy` instead.
     * @example
     * ```
     * import { AttributeDataType } from `@msdyn365-commerce/retail-proxy`;
     * ```
     */
    List = 5,

    /**
     * Boolean types allows only single-select.
     * @deprecated This will be removed soon. Please, use `AttributeDataType` from `@msdyn365-commerce/retail-proxy` instead.
     * @example
     * ```
     * import { AttributeDataType } from `@msdyn365-commerce/retail-proxy`;
     * ```
     */
    Boolean = 6
}

/**
 * Types of product refiners.
 * @deprecated This will be removed soon. Please, use `RefinerType` from `@msdyn365-commerce/retail-proxy` instead.
 * @example
 * ```
 * import { RefinerType } from `@msdyn365-commerce/retail-proxy`;
 * ```
 */
export enum ProductRefinerTypeValue {
    /**
     * Refiner values are single-select.
     * @deprecated This will be removed soon. Please, use `RefinerType` from `@msdyn365-commerce/retail-proxy` instead.
     * @example
     * ```
     * import { RefinerType } from `@msdyn365-commerce/retail-proxy`;
     * ```
     */
    Single = 0,

    /**
     * Refiner values are multi-select.
     * @deprecated This will be removed soon. Please, use `RefinerType` from `@msdyn365-commerce/retail-proxy` instead.
     * @example
     * ```
     * import { RefinerType } from `@msdyn365-commerce/retail-proxy`;
     * ```
     */
    Multi = 1
}

/**
 * ProductRefinerSource enum type.
 * @deprecated This will be removed soon. Please, use `ProductRefinerSource` from `@msdyn365-commerce/retail-proxy` instead.
 * @example
 * ```
 * import { ProductRefinerSource } from `@msdyn365-commerce/retail-proxy`;
 * ```
 */
export enum ProductRefinerSource {
    /**
     * The None member.
     * @deprecated This will be removed soon. Please, use `ProductRefinerSource` from `@msdyn365-commerce/retail-proxy` instead.
     * @example
     * ```
     * import { ProductRefinerSource } from `@msdyn365-commerce/retail-proxy`;
     * ```
     */
    None = 0,

    /**
     * The Attribute member.
     * @deprecated This will be removed soon. Please, use `ProductRefinerSource` from `@msdyn365-commerce/retail-proxy` instead.
     * @example
     * ```
     * import { ProductRefinerSource } from `@msdyn365-commerce/retail-proxy`;
     * ```
     */
    Attribute = 1,

    /**
     * The Category member.
     * @deprecated This will be removed soon. Please, use `ProductRefinerSource` from `@msdyn365-commerce/retail-proxy` instead.
     * @example
     * ```
     * import { ProductRefinerSource } from `@msdyn365-commerce/retail-proxy`;
     * ```
     */
    Category = 2,

    /**
     * The Price member.
     * @deprecated This will be removed soon. Please, use `ProductRefinerSource` from `@msdyn365-commerce/retail-proxy` instead.
     * @example
     * ```
     * import { ProductRefinerSource } from `@msdyn365-commerce/retail-proxy`;
     * ```
     */
    Price = 3,

    /**
     * The Rating member.
     * @deprecated This will be removed soon. Please, use `ProductRefinerSource` from `@msdyn365-commerce/retail-proxy` instead.
     * @example
     * ```
     * import { ProductRefinerSource } from `@msdyn365-commerce/retail-proxy`;
     * ```
     */
    Rating = 4
}

export interface IRefineItemData {
    sourceValue?: number;
    swatchImageUrl?: string;
    swatchColorHexCode?: string;
    refinerItemId: number;
    dataTypeValue?: number;
    name: string;
    label: string;
    count?: number;
    isChecked: boolean;
    refineItemUrl?: string;
    minValue?: string;
    maxValue?: string;
    dimensionType?: DimensionTypes;
    rowNumber?: number;
    unitText?: string;
    updatedSliderMaxValue?: string;
    updatedSliderMinValue?: string;
}
/**
 * Checks if the data type value corresponds to a slider.
 * @param dataTypeValue
 */
export function isRangeType(dataTypeValue: number | undefined): boolean {
    return dataTypeValue === AttributeDataType.Currency || dataTypeValue === AttributeDataType.Decimal;
}

/**
 * Checks if the data type value corresponds to a range type integer.
 * @param dataTypeValue
 */
export function isRangeTypeForInteger(dataTypeValue: number | undefined): boolean {
    return (
        dataTypeValue === AttributeDataType.Currency ||
        dataTypeValue === AttributeDataType.Decimal ||
        dataTypeValue === AttributeDataType.Integer
    );
}

/**
 * Checks if the data type value corresponds to a custom input box Range.
 * @param dataTypeValue
 */
export function isCustomRangeTypeIntegerSelected(
    selectedRefinementCriterion: ProductRefinerValue,
    parentProductRefinerHierarchy: IProductRefinerHierarchy
): boolean {
    return (
        selectedRefinementCriterion?.RowNumber !== undefined &&
        selectedRefinementCriterion?.RowNumber !== null &&
        selectedRefinementCriterion?.DataTypeValue === AttributeDataType.Integer &&
        parentProductRefinerHierarchy.DisplayTemplateValue === DisplayTemplate.Range
    );
}

/**
 * Checks if the selectedRefinementCriterion is siingle type with API va;ues or custom type.
 * If custom type then RowNumber is null
 * @param dataTypeValue
 */
export function isSingleSelectRangeTypeIntegerSelected(
    selectedRefinementCriterion: ProductRefinerValue,
    productRefinerValue: ProductRefinerValue
): boolean {
    return (
        productRefinerValue.LeftValueBoundString === selectedRefinementCriterion?.LeftValueBoundString &&
        productRefinerValue.RightValueBoundString === selectedRefinementCriterion?.RightValueBoundString &&
        selectedRefinementCriterion?.RowNumber !== undefined &&
        selectedRefinementCriterion?.RowNumber !== null &&
        selectedRefinementCriterion !== undefined
    );
}

/**
 * Find the refinement criterion associated with this product refiner value.
 * @param productRefinerValue Product refiner value to match.
 * @param refinementCriteria Selected refinement criteria.
 */
export function findMatchingRefinementCriterion(
    productRefinerValue: ProductRefinerValue,
    refinementCriteria: ProductRefinerValue[]
): ProductRefinerValue | undefined {
    // If the value is a range, then match only on data type value; otherwise match on item string
    return refinementCriteria.find((refinementCriterion: ProductRefinerValue) =>
        isMatchingRefinementCriterion(productRefinerValue, refinementCriterion)
    );
}

/**
 * Find the refinement criterion associated with this product refiner value.
 * @param productRefinerValue Product refiner value to match.
 * @param refinementCriteria Selected refinement criteria.
 * @param refinementCriterion
 */
export function isMatchingRefinementCriterion(
    productRefinerValue: ProductRefinerValue,
    refinementCriterion: ProductRefinerValue,
    parent?: IProductRefinerHierarchy
): boolean {
    // If the value is a range, then match only on data type value; otherwise match on item string
    // Distinguish by displaytype also
    return (
        refinementCriterion.RefinerRecordId === productRefinerValue.RefinerRecordId &&
        refinementCriterion.RefinerSourceValue === productRefinerValue.RefinerSourceValue &&
        refinementCriterion.DataTypeValue === productRefinerValue.DataTypeValue &&
        ((parent?.DisplayTemplateValue === DisplayTemplate.Range
            ? isRangeType(refinementCriterion.DataTypeValue)
            : isRangeTypeForInteger(refinementCriterion.DataTypeValue)) ||
            refinementCriterion.LeftValueBoundString === productRefinerValue.LeftValueBoundString)
    );
}

export function getIntegerRangeName(productRefinerValue: ProductRefinerValue): string {
    let rangeValue = '';

    if (productRefinerValue.LeftValueBoundString === '' && productRefinerValue.RightValueBoundString !== '') {
        rangeValue = `< ${productRefinerValue.RightValueBoundLocalizedString || productRefinerValue.RightValueBoundString}`;
    } else if (productRefinerValue.RightValueBoundString === '' && productRefinerValue.LeftValueBoundString !== '') {
        rangeValue = `> ${productRefinerValue.LeftValueBoundLocalizedString || productRefinerValue.LeftValueBoundString}`;
    } else if (productRefinerValue.RightValueBoundString !== '' && productRefinerValue.LeftValueBoundString !== '') {
        rangeValue = `${productRefinerValue.LeftValueBoundLocalizedString ||
            productRefinerValue.LeftValueBoundString}  - ${productRefinerValue.RightValueBoundString ||
            productRefinerValue.RightValueBoundString}`;
    }
    return rangeValue;
}

/**
 * Get input without formatting.
 * @param input - Input string.
 * @returns - Returns number.
 */
export function getInputWithoutFormatting(input: string): string {
    // First try to cast raw input to a number
    const inputAsNumber = Number(input);
    if (!Number.isNaN(inputAsNumber)) {
        return input;
    }

    // Otherwise try a reverse lookup and fall back to the raw input if all else fails
    // const reverseLookupResult = formattedPriceReverseLookup.get(input);
    // return reverseLookupResult || input;
    return input;
}

export function getUpdatedRefinementCriteria(
    itemToggleNotification: IRefineItemToggleNotification,
    currentRefinementCriteria: ProductRefinerValue[]
): ProductRefinerValue[] {
    const updatedRefinementCriteria: ProductRefinerValue[] = [];
    let toggledItemFound = false;

    // Keeping only itemToggled value for integer-range type in currentRefinementCriteria
    if (
        itemToggleNotification.parentProductRefinerHierarchy.DataTypeValue === AttributeDataType.Integer &&
        itemToggleNotification.parentProductRefinerHierarchy.DisplayTemplateValue === DisplayTemplate.Range
    ) {
        currentRefinementCriteria = currentRefinementCriteria.filter(r => {
            return r.RefinerRecordId !== itemToggleNotification.productRefinerValue.RefinerRecordId;
        });
    }

    currentRefinementCriteria.forEach((selectedCriterion: ProductRefinerValue) => {
        if (
            isMatchingRefinementCriterion(
                itemToggleNotification.productRefinerValue,
                selectedCriterion,
                itemToggleNotification.parentProductRefinerHierarchy
            )
        ) {
            toggledItemFound = true;
            if (itemToggleNotification.isSelecting) {
                const next = {
                    ...selectedCriterion,
                    LeftValueBoundString:
                        (itemToggleNotification.rangeStart !== undefined && `${itemToggleNotification.rangeStart}`) ||
                        selectedCriterion.LeftValueBoundString,
                    RightValueBoundString:
                        (itemToggleNotification.rangeEnd !== undefined && `${itemToggleNotification.rangeEnd}`) ||
                        selectedCriterion.RightValueBoundString
                };
                updatedRefinementCriteria.push(next);
            } // Else the item is being de-selected, so omit it from the refinement criteria
        } else {
            // Keep existing criterion because it is not in the item toggle notification
            updatedRefinementCriteria.push(selectedCriterion);
        }
    });

    if (!toggledItemFound) {
        const next = {
            ...itemToggleNotification.productRefinerValue,
            LeftValueBoundString:
                (itemToggleNotification.rangeStart !== undefined && `${itemToggleNotification.rangeStart}`) ||
                itemToggleNotification.productRefinerValue.LeftValueBoundString,
            RightValueBoundString:
                (itemToggleNotification.rangeEnd !== undefined && `${itemToggleNotification.rangeEnd}`) ||
                itemToggleNotification.productRefinerValue.RightValueBoundString
        };
        updatedRefinementCriteria.push(next);

        // If single select, then deselect any others in the parent refiner group
        if (
            (itemToggleNotification.productRefinerValue.DataTypeValue === AttributeDataType.Text ||
                itemToggleNotification.productRefinerValue.DataTypeValue === AttributeDataType.TrueFalse) &&
            itemToggleNotification.parentProductRefinerHierarchy.RefinerTypeValue === RefinerType.SingleSelect
        ) {
            itemToggleNotification.parentProductRefinerHierarchy.Values.forEach((child: ProductRefinerValue) => {
                if (child.RefinerRecordId === next.RefinerRecordId && child.LeftValueBoundString === next.LeftValueBoundString) {
                    // Do nothing
                } else {
                    const matchingIndex = updatedRefinementCriteria.findIndex((criterion: ProductRefinerValue) =>
                        isMatchingRefinementCriterion(child, criterion, itemToggleNotification.parentProductRefinerHierarchy)
                    );
                    if (matchingIndex > -1) {
                        updatedRefinementCriteria.splice(matchingIndex, 1);
                    }
                }
            });
        }
    }

    return updatedRefinementCriteria;
}

export function formatPrice(
    amount: string | undefined,
    currency: string | undefined,
    locale: string | undefined,
    telemetry: ITelemetry
): string {
    if (!amount || !currency) {
        telemetry.trace(`[refine-menu.utilities.formatPrice] could not format price for ${amount} ${currency}`);
        return amount || '';
    }
    const priceAmount = (amount && Number(amount)) || 0;
    let result: string;

    try {
        result = new Intl.NumberFormat(locale, {
            style: 'currency',
            currencyDisplay: 'symbol',
            currency,
            minimumFractionDigits: 0
        }).format(priceAmount);
    } catch (error) {
        result = `${priceAmount} ${currency}`;
        telemetry.warning(`[refine-menu.utilities.formatPrice] Failed to format price for ${result}: ${error}`);
    }

    return result;
}
