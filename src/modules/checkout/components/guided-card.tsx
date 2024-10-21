/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { IModuleStateManager } from '@msdyn365-commerce-modules/checkout-utilities';
import { Heading as HeadingType } from '@msdyn365-commerce-modules/data-types';
import {
    Button,
    getPayloadObject,
    getTelemetryAttributes,
    IPayLoad,
    ITelemetryContent,
    TelemetryConstant
} from '@msdyn365-commerce-modules/utilities';
import { IActionContext } from '@msdyn365-commerce/core';
import classname from 'classnames';
import get from 'lodash/get';
import * as React from 'react';
import { focusOnCheckoutError, setCheckoutErrorFocus } from '@msdyn365-commerce-modules/checkout';

export interface ICheckoutGuidedCardProps {
    id?: string;
    step: number;
    title?: HeadingType;
    disabled?: boolean; // Module is not available
    isActive?: boolean; // Step === currentStep
    isVisted?: boolean; // Step < currentStep
    isExpanded?: boolean;
    isReady?: boolean;
    isPending?: boolean;
    isUpdating?: boolean;
    isSubmitting?: boolean;
    isCancelAllowed?: boolean;
    isMobile?: boolean;
    hasInitialized?: boolean;
    hasControlGroup?: boolean;
    shouldFocus?: boolean;
    children: React.ReactNode;
    moduleState?: IModuleStateManager;
    actionContext?: IActionContext;
    resource: {
        checkoutStepTitleFormat: string;
        saveBtnLabel: string;
        changeBtnLabel: string;
        cancelBtnLabel: string;
        saveAndContinueBtnLabel: string;
    };
    telemetryContent?: ITelemetryContent;
    onEdit?(): void;
    onCancel?(): void;
    onSubmit?(): void;
    onNext(): void;
}

/**
 *
 * CheckoutGuidedCard component.
 * @extends {React.Component<ICheckoutGuidedCardProps>}
 */
class CheckoutGuidedCard extends React.PureComponent<ICheckoutGuidedCardProps> {
    private readonly editButtonRef: React.RefObject<HTMLButtonElement> = React.createRef();

    private readonly formCardRef: React.RefObject<HTMLDivElement> = React.createRef();

    private readonly payLoad: IPayLoad;

    constructor(props: ICheckoutGuidedCardProps) {
        super(props);
        this.payLoad = getPayloadObject('click', props.telemetryContent!, '');
    }

    public componentDidUpdate(prevProps: ICheckoutGuidedCardProps): void {
        /**
         * Move to next step when current step is ready.
         */
        const { isActive, isReady, onNext, isVisted, onEdit, shouldFocus, children, moduleState, actionContext } = this.props;

        // Move to next step after completing the current step
        if (isActive && isReady) {
            onNext();
        }

        // Set the focus to Edit button once edit button appear
        // (It happens when current step switch to isReady status)
        const prevCanEdit = prevProps.isReady && prevProps.isVisted && !!prevProps.onEdit;
        const canEdit = isReady && isVisted && !!onEdit;
        if (!prevCanEdit && canEdit) {
            this.focusOnEditButton();
            this.scrollToTitle();
        }

        // Set the focus to the first focusable element
        // (It happens when current step switch to isUpdating status)
        if (prevProps.isReady && !isReady) {
            this.focusOnFirstFocusableElement();
        }

        // Set the focus for the checkout error
        if (shouldFocus && actionContext) {
            const childrenModules = this._getModules(children);

            // Set the focus for the module within the checkout section container
            if (childrenModules.length > 0) {
                for (const childModule of childrenModules) {
                    const childId = this._getId(childModule);
                    const childState = moduleState?.getModule(childId);

                    if (childState?.hasError) {
                        setCheckoutErrorFocus(childId, actionContext);
                        return;
                    }
                }
            } else {
                focusOnCheckoutError(this.formCardRef, actionContext);
            }
        }
    }

    public render(): JSX.Element | null {
        const {
            title,
            disabled,
            isExpanded,
            isActive,
            isVisted,
            children,
            isReady,
            isPending,
            isUpdating,
            hasInitialized,
            hasControlGroup,
            onEdit,
            resource
        } = this.props;
        const { changeBtnLabel } = resource;

        this.payLoad.contentAction.etext = TelemetryConstant.CheckoutChange;
        const changeBtnAttributes = getTelemetryAttributes(this.props.telemetryContent!, this.payLoad);
        const canEdit = hasControlGroup && isReady && isVisted && onEdit;

        return (
            <div
                className={classname('ms-checkout__guided-card', {
                    active: isActive,
                    expanded: isExpanded,
                    closed: !isExpanded,
                    visted: isVisted,
                    hidden: disabled,
                    initialized: hasInitialized,
                    disabled,
                    ready: isReady,
                    pending: isPending,
                    updating: isUpdating
                })}
                ref={this.formCardRef}
            >
                <div className='ms-checkout__guided-card-header'>
                    {this.getTitle()}

                    {canEdit && (
                        <Button
                            innerRef={this.editButtonRef}
                            className='ms-checkout__guided-card-btn-edit'
                            title={changeBtnLabel}
                            color='link'
                            onClick={onEdit}
                            role='button'
                            aria-label={title && title.text ? `${changeBtnLabel} ${title.text}` : ''}
                            {...changeBtnAttributes}
                        >
                            {changeBtnLabel}
                        </Button>
                    )}
                </div>

                <div
                    className={classname('ms-checkout__guided-card-body', {
                        hidden: !isExpanded
                    })}
                >
                    <div className='ms-checkout__guided-card-content'>{children}</div>

                    {this.renderFooder()}
                </div>
            </div>
        );
    }

    private readonly renderFooder = (): JSX.Element | null => {
        const { isVisted, isReady, isSubmitting, isCancelAllowed, hasControlGroup, onCancel, onSubmit, resource } = this.props;
        const { saveBtnLabel, cancelBtnLabel, saveAndContinueBtnLabel } = resource;

        const canSubmit = !isReady && onSubmit;
        const canCancel = !isReady && isVisted && isCancelAllowed && onCancel;

        if (!hasControlGroup || (!canSubmit && !canCancel)) {
            return null;
        }

        this.payLoad.contentAction.etext = isVisted ? TelemetryConstant.Save : TelemetryConstant.SaveContinue;
        const saveBtnAttributes = getTelemetryAttributes(this.props.telemetryContent!, this.payLoad);
        this.payLoad.contentAction.etext = TelemetryConstant.Cancel;
        const cancelBtnAttributes = getTelemetryAttributes(this.props.telemetryContent!, this.payLoad);

        return (
            <div className='ms-checkout__guided-card-footer'>
                {canSubmit && (
                    <Button
                        className={classname('ms-checkout__guided-card-btn-save', { 'is-submitting': isSubmitting })}
                        title={isVisted ? saveBtnLabel : saveAndContinueBtnLabel}
                        color='primary'
                        disabled={isSubmitting}
                        onClick={onSubmit}
                        {...saveBtnAttributes}
                    >
                        {isVisted && isCancelAllowed ? saveBtnLabel : saveAndContinueBtnLabel}
                    </Button>
                )}
                {canCancel && (
                    <Button
                        className='ms-checkout__guided-card-btn-cancel'
                        title={cancelBtnLabel}
                        color='secondary'
                        onClick={onCancel}
                        {...cancelBtnAttributes}
                    >
                        {cancelBtnLabel}
                    </Button>
                )}
            </div>
        );
    };

    private readonly focusOnFirstFocusableElement = (): void => {
        const node = this.formCardRef.current as HTMLElement;
        const focussableElements = `
             a:not([disabled]),
             button:not([disabled]),
             input[type=submit]:not([disabled]),
             input[type=checkbox]:not([disabled]),
             input[type=text]:not([disabled]),
             input[type=radio]:not([disabled]),
             input[type=password]:not([disabled]),
             select:not([disabled]),
             textarea:not([disabled]),
             [tabindex]:not([disabled]):not([tabindex="-1"])
         `;

        const child = node && node.querySelector && (node.querySelector(focussableElements) as HTMLElement);
        child && child.focus && child.focus();
    };

    private readonly focusOnEditButton = (): void => {
        // Focus on edit button
        const editButton =
            this.editButtonRef &&
            this.editButtonRef.current &&
            this.editButtonRef.current.focus &&
            (this.editButtonRef.current as HTMLElement);
        editButton && editButton.focus();
    };

    private readonly scrollToTitle = (): void => {
        // Scroll window to the title of the step that was just completed only in mobile viewport
        const formCard = this.props.isMobile && this.formCardRef && this.formCardRef.current && (this.formCardRef.current as HTMLElement);
        formCard && formCard.scrollIntoView();
    };

    private readonly getTitle = (): JSX.Element => {
        const { step, title } = this.props;
        const { headingTag: Tag = 'h2', text = '' } = title || {};
        return (
            <Tag className='ms-checkout__guided-card-title'>
                <span className='ms-checkout__guided-card-title-step'>
                    {step + 1}. {` `}
                </span>
                {text && <span className='ms-checkout__guided-card-title-text'>{text}</span>}
            </Tag>
        );
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly _getModules = (item: React.ReactNode): any[] => {
        return get(item, 'props.modules.primary') || [];
    };

    private readonly _getId = (item: React.ReactNode): string => {
        return get(item, 'id') || '';
    };
}

export default CheckoutGuidedCard;
