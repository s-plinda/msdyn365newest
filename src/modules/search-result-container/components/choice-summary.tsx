/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { IProductRefinerHierarchy } from '@msdyn365-commerce/commerce-entities';
import { AttributeDataType, DisplayTemplate, ProductRefinerValue } from '@msdyn365-commerce/retail-proxy';
import { getPayloadObject, getTelemetryAttributes, IPayLoad } from '@msdyn365-commerce-modules/utilities';
import classnames from 'classnames';
import { computed } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import { ProductListInventoryFilteringOptions } from '../actions';
import { IChoiceSummaryProps } from './choice-summary.props';
import { getIntegerRangeName, isMatchingRefinementCriterion, isRangeType } from './utilities';

interface IRefinerMap {
    key: string;
    value: ProductRefinerValue;
    rangeDisplayType?: number | undefined;
}

/**
 * ChoiceSummary component.
 */
@observer
export default class ChoiceSummary extends React.PureComponent<IChoiceSummaryProps> {
    private readonly closeButtonGlyph: string = 'msi-close-btn';

    private readonly payLoad: IPayLoad;

    @computed get selectedRefinersMap(): IRefinerMap[] {
        let { selectedChoices } = this.props;
        const { channelInventoryConfigurationId, refinerHierarchy } = this.props;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- app configs are of generic type
        if (this.props.context?.app.config.productListInventoryDisplay === ProductListInventoryFilteringOptions.HideOOS) {
            selectedChoices = selectedChoices.filter(choice => {
                const parent = refinerHierarchy.find(
                    (hierarchy: IProductRefinerHierarchy) =>
                        !!hierarchy.Values.find((value: ProductRefinerValue) => isMatchingRefinementCriterion(value, choice))
                );
                return parent && parent.RecordId !== channelInventoryConfigurationId;
            });
        }
        return selectedChoices.map((selectedRefiner: ProductRefinerValue, index) => {
            const rangeParentDisplay = refinerHierarchy.filter(p => p.RecordId === selectedRefiner.RefinerRecordId);
            return {
                key: this._getKeyForRefinerValue(selectedRefiner, index.toString()),
                value: selectedRefiner,
                // parameter to store Display Template type
                rangeDisplayType: rangeParentDisplay[0]?.DisplayTemplateValue || undefined
            } as IRefinerMap;
        });
    }

    constructor(props: Readonly<IChoiceSummaryProps>) {
        super(props);
        this.payLoad = getPayloadObject('click', this.props.telemetryContent!, '');
    }

    public render(): JSX.Element {
        const { clearAllText, label, classNames, choiceAriaLabel, closeAriaLabel } = this.props;
        const items = this.selectedRefinersMap;
        this.payLoad.contentAction.etext = clearAllText;
        const clearAllAttributes = getTelemetryAttributes(this.props.telemetryContent!, this.payLoad);
        return (
            <div className='msc-choice-summary'>
                {items.length > 0 && label && <span className='msc-choice-summary__label'>{label}</span>}
                <ul className={classnames(classNames, 'msc-choice-summary__list', 'list-unstyled')}>
                    {items.map((item: IRefinerMap) => {
                        this.payLoad.contentAction.etext = item.key;
                        const attribute = getTelemetryAttributes(this.props.telemetryContent!, this.payLoad);
                        // Get range value for Range display and integer type only (not for Integer with TextBox(4) display)
                        const rangeInteger =
                            item.value.DataTypeValue === AttributeDataType.Integer &&
                            item.rangeDisplayType &&
                            item.rangeDisplayType === DisplayTemplate.Range &&
                            item.value.RefinerRecordId !== 0;
                        const newIntRange = rangeInteger
                            ? item.key
                            : item.value.LeftValueBoundString && item.value.LeftValueBoundLocalizedString === ''
                            ? item.value.LeftValueBoundString
                            : (item.value.LeftValueBoundLocalizedString || item.value.LeftValueBoundLocalizedString === undefined) &&
                              item.value.RefinerRecordId === 0
                            ? item.key
                            : item.value.LeftValueBoundString;
                        return (
                            <li className='msc-choice-summary__list-item' key={item.key}>
                                <a
                                    className='msc-choice-summary__item'
                                    href={this.props.urlBuilder(item.value, false)}
                                    aria-label={`${item.value.LeftValueBoundString} ${choiceAriaLabel}`}
                                    onClick={this._onClick}
                                    role='button'
                                    id={item.key}
                                    {...attribute}
                                >
                                    {newIntRange}
                                    <span
                                        className={`${this.closeButtonGlyph} msc-choice-summary__glyph`}
                                        role='button'
                                        aria-label={closeAriaLabel}
                                    />
                                </a>
                            </li>
                        );
                    })}
                </ul>
                {items.length > 0 && clearAllText && (
                    <a
                        href={this.props.urlBuilder({}, true)}
                        className='msc-choice-summary__clear-all'
                        {...clearAllAttributes}
                        onClick={this._onClick}
                    >
                        {clearAllText}
                    </a>
                )}
            </div>
        );
    }

    private _getKeyForRefinerValue(productRefinerValue: ProductRefinerValue, index: string): string {
        const { choiceFormat, choiceRangeValueFormat, refinerHierarchy, telemetry, refinerValues } = this.props;
        const overallFormat = choiceFormat || '{1}';
        const rangeFormat = choiceRangeValueFormat;
        let refinerName = '';
        let parent: IProductRefinerHierarchy | undefined;
        if (refinerHierarchy && refinerHierarchy.find) {
            parent = refinerHierarchy.find(
                (hierarchy: IProductRefinerHierarchy) =>
                    !!hierarchy.Values.find((value: ProductRefinerValue) => isMatchingRefinementCriterion(value, productRefinerValue))
            );

            if (!parent) {
                telemetry.warning('[choice-summary] could not find parent of selected refiner value');
            } else {
                refinerName = parent.KeyName || '';
            }
        }

        let refinerValueName: string;
        if (isRangeType(productRefinerValue.DataTypeValue)) {
            refinerValueName = rangeFormat
                .replace('{0}', this._formatPrice(productRefinerValue.LeftValueBoundString, productRefinerValue.UnitText))
                .replace('{1}', this._formatPrice(productRefinerValue.RightValueBoundString, productRefinerValue.UnitText));
        } else if (productRefinerValue.RefinerRecordId === 0) {
            const filterValue = refinerValues?.Values.find(
                refiner => refiner.LeftValueBoundString === productRefinerValue.LeftValueBoundString
            );
            refinerValueName = (filterValue ? filterValue.LeftValueBoundLocalizedString : productRefinerValue.LeftValueBoundString) || '';
        } else {
            refinerValueName = productRefinerValue.LeftValueBoundLocalizedString || productRefinerValue.LeftValueBoundString || '';
        }

        if (refinerName === 'Rating' || refinerName === 'Price') {
            return overallFormat.replace('{0}', refinerName).replace('{1}', `${refinerValueName}`);
        }
        // Adding integer range format
        if (
            productRefinerValue.DataTypeValue === AttributeDataType.Integer &&
            parent?.DisplayTemplateValue === DisplayTemplate.Range &&
            productRefinerValue.RefinerRecordId !== 0
        ) {
            refinerValueName = getIntegerRangeName(productRefinerValue);
            return refinerValueName;
        }
        return overallFormat.replace('{0}', refinerName).replace('{1}', `${refinerValueName}_${refinerName}_${index}`);
    }

    private _formatPrice(amount: string | undefined, currency: string | undefined): string {
        if (!amount || !currency) {
            this.props.telemetry.trace('[choice-summary] could not format price');
            return amount || '';
        }
        let result = amount;

        try {
            result = this.props.context!.cultureFormatter.formatCurrency(Number(amount), currency);
        } catch (error) {
            this.props.telemetry.warning(`Failed to format price for ${result}: ${error}`);
        }

        return result;
    }

    private readonly _onClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.currentTarget as HTMLElement;
        const clearAll = target.getAttribute('class')!.includes('choice-summary__clear-all');
        const selectedRefiner = clearAll ? undefined : this._getSelectedRefinerChoice(target);

        if (this.props.onChoiceClicked) {
            this.props.onChoiceClicked({
                clearAll,
                itemClicked: target,
                choiceClicked: selectedRefiner,
                nextItemToFocus: target.nextSibling as HTMLElement
            });
        }
    };

    private _getSelectedRefinerChoice(itemClicked: HTMLElement): ProductRefinerValue | undefined {
        const result = this.selectedRefinersMap.find(selected => itemClicked.id === selected.key);
        return (result && result.value) || undefined;
    }
}
