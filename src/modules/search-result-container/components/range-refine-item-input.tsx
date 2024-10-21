/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { observer } from 'mobx-react';
import * as React from 'react';

import { isUndefined } from 'lodash';
import { ProductRefinerValue } from '@msdyn365-commerce/retail-proxy';
import { Button } from '@msdyn365-commerce-modules/utilities';
import { IRefineItemState } from './refine-item';
import { isCustomRangeTypeIntegerSelected } from './utilities';
import { IProductRefinerHierarchy } from '@msdyn365-commerce/commerce-entities';
import { IRefineItemCommonProps } from './refine-item.props.common';
import { IRefineItemToggleNotification } from './refine-item-toggle-notification';

export type RangeRefineItemInputType = 'slider' | 'input';

/**
 * Range refine item properties.
 */
export interface IRangeRefineItemInputProps {
    parentProductRefinerHierarchy: IProductRefinerHierarchy;
    selectedRefinementCriterion: ProductRefinerValue | undefined;
    refineItemCommonProps: IRefineItemCommonProps;
    isDisabled: boolean;
    rangeType: RangeRefineItemInputType;

    /**
     * The telemetry content
     */
    onToggle(notfication: Readonly<IRefineItemToggleNotification>): void;
}

/**
 * Range refine item state.
 */
export interface IRangeRefineItemInputState extends IRefineItemState {
    validationErrorMin: string | undefined;
    validationErrorMax: string | undefined;
    selectedMin: string | undefined;
    selectedMax: string | undefined;
    invalidData: boolean | undefined;
}

/**
 * RangeRefineItem component (controlled by RefineSubmenu).
 */
@observer
export default class RangeRefineItemInput extends React.Component<IRangeRefineItemInputProps, IRangeRefineItemInputState> {
    private readonly _formattedPriceReverseLookup: Map<string, string> = new Map();

    private readonly minInput: React.RefObject<HTMLInputElement>;

    private readonly maxInput: React.RefObject<HTMLInputElement>;

    public constructor(props: IRangeRefineItemInputProps) {
        super(props);
        this._changeMinInputRange = this._changeMinInputRange.bind(this);
        this._changeMaxInputRange = this._changeMaxInputRange.bind(this);
        this._applyCustom = this._applyCustom.bind(this);

        this.minInput = React.createRef<HTMLInputElement>();
        this.maxInput = React.createRef<HTMLInputElement>();
        let initialMin = '';
        let initialMax = '';
        const { selectedRefinementCriterion, parentProductRefinerHierarchy } = this.props;
        if (selectedRefinementCriterion) {
            initialMin = isCustomRangeTypeIntegerSelected(selectedRefinementCriterion, parentProductRefinerHierarchy)
                ? ''
                : selectedRefinementCriterion?.LeftValueBoundString || '';
            initialMax = isCustomRangeTypeIntegerSelected(selectedRefinementCriterion, parentProductRefinerHierarchy)
                ? ''
                : selectedRefinementCriterion?.RightValueBoundString || '';
        }

        this.state = {
            validationErrorMin: undefined,
            validationErrorMax: undefined,
            selectedMin: initialMin,
            selectedMax: initialMax,
            invalidData: !(initialMin && initialMax),
            isChecked: false
        };
    }

    public shouldComponentUpdate(nextProps: IRangeRefineItemInputProps, nextState: IRangeRefineItemInputState): boolean {
        if (this.state === nextState && this.props === nextProps) {
            return false;
        }
        nextState.invalidData = !(nextState.selectedMin && nextState.selectedMax);
        return true;
    }

    public componentDidUpdate(previousProps: IRangeRefineItemInputProps): void {
        if (previousProps !== this.props) {
            this.updateInputRangerProps();
        }
    }

    public render(): JSX.Element | undefined {
        if (this.props.rangeType === 'input') {
            return this._renderInputFields();
        }
        return undefined;
    }

    // /**
    //  * Function to update slider props.
    //  */
    private updateInputRangerProps(): void {
        const selectedMin = !isUndefined(this.props.selectedRefinementCriterion?.RowNumber)
            ? ''
            : this.props.selectedRefinementCriterion?.LeftValueBoundString;
        const selectedMax = !isUndefined(this.props.selectedRefinementCriterion?.RowNumber)
            ? ''
            : this.props.selectedRefinementCriterion?.RightValueBoundString;
        this.setState({ selectedMin, selectedMax });
    }

    private _renderInputFields(): JSX.Element | undefined {
        const { isDisabled, parentProductRefinerHierarchy, refineItemCommonProps } = this.props;
        const { validationErrorMin, validationErrorMax } = this.state;

        const rangeAriaLabel = (refineItemCommonProps.rangeNameFormat || '{0}').replace('{0}', parentProductRefinerHierarchy.KeyName || '');
        const formAttrs = {
            'aria-label': rangeAriaLabel,
            'aria-disabled': isDisabled
        };

        const minInputClassName = `ms-refine-submenu__input-range refine-submenu__input-range-min ${
            validationErrorMin ? 'refine-submenu__input-range--error' : ''
        }`;
        const maxInputClassName = `ms-refine-submenu__input-range refine-submenu__input-range-max ${
            validationErrorMax ? 'refine-submenu__input-range--error' : ''
        }`;
        return (
            <li className='ms-refine-submenu-item list-group-item refine-submenu__item--range--custom'>
                <form className={`ms-refine-submenu__input-range-refiner`} {...formAttrs}>
                    <div>
                        <input
                            className={minInputClassName}
                            placeholder={'Min'}
                            onChange={this._changeMinInputRange}
                            value={this.state.selectedMin}
                            ref={this.minInput}
                        />
                        <span>{' - '}</span>
                        <input
                            className={maxInputClassName}
                            placeholder={'Max'}
                            onChange={this._changeMaxInputRange}
                            value={this.state.selectedMax}
                            ref={this.maxInput}
                        />
                        {validationErrorMin && (
                            <span className='ms-refine-submenu__input-range-error-text refine-submenu__input-range-min-error-text'>
                                {validationErrorMin}
                            </span>
                        )}
                        {validationErrorMax && validationErrorMin !== validationErrorMax && (
                            <span className='ms-refine-submenu__input-range-error-text refine-submenu__input-range-max-error-text'>
                                {validationErrorMax}
                            </span>
                        )}
                    </div>
                    <div>
                        <Button title={'Apply'} className='applyBtn' onClick={this._applyCustom} disabled={this.state.invalidData}>
                            {'Apply'}
                        </Button>
                    </div>
                </form>
            </li>
        );
    }

    private _applyCustom(event: React.MouseEvent<HTMLElement>): void {
        const selectedMinValue = this._getInputWithoutFormatting(this.state.selectedMin || '');
        this.setState({
            selectedMin: selectedMinValue,
            minTouched: false
        });
        const minInput = Number(selectedMinValue);
        const { onToggle, parentProductRefinerHierarchy } = this.props;
        const max = this.state.selectedMax;

        const maxNum = max ? Number(max) : undefined;
        const productRefinerValue: ProductRefinerValue = {
            RefinerRecordId: parentProductRefinerHierarchy.Values[0].RefinerRecordId,
            LeftValueBoundString: this.state.selectedMin,
            RightValueBoundString: this.state.selectedMax,
            DataTypeValue: parentProductRefinerHierarchy.DataTypeValue,
            RefinerSourceValue: parentProductRefinerHierarchy.Values[0].RefinerSourceValue
        };

        if (this._validateRange(minInput, maxNum)) {
            onToggle({
                parentProductRefinerHierarchy,
                productRefinerValue,
                isSelecting: true
            });
        }
    }

    private _changeMinInputRange(event: React.ChangeEvent<HTMLInputElement>): void {
        this.setState({
            selectedMin: event.target.value.trim()
        });
    }

    private _changeMaxInputRange(event: React.ChangeEvent<HTMLInputElement>): void {
        this.setState({
            selectedMax: event.target.value.trim()
        });
    }

    private _validateRange(min: number, max: number | undefined): boolean {
        const { refineItemCommonProps } = this.props;
        if (max === undefined) {
            return true;
        }

        if (min > max) {
            this.setState({
                validationErrorMin: refineItemCommonProps.validationErrorRange,
                validationErrorMax: refineItemCommonProps.validationErrorRange
            });
            return false;
        }

        return true;
    }

    private _getInputWithoutFormatting(input: string): string {
        // First try to cast raw input to a number
        const inputAsNum = Number(input);
        if (!isNaN(inputAsNum)) {
            return input;
        }

        // Otherwise try a reverse lookup and fall back to the raw input if all else fails
        const reverseLookupResult = this._formattedPriceReverseLookup.get(input);
        return reverseLookupResult || input;
    }
}
