/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { IModuleStateManager } from '@msdyn365-commerce-modules/checkout-utilities';
import { Heading } from '@msdyn365-commerce-modules/data-types';
import { ArrayExtensions } from '@msdyn365-commerce-modules/retail-actions';
import { ITelemetryContent } from '@msdyn365-commerce-modules/utilities';
import { ICoreContext } from '@msdyn365-commerce/core';
import get from 'lodash/get';
import { computed } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import GuidedCard from './guided-card';

export interface ICheckoutGuidedFormProps {
    items: React.ReactNode[];
    moduleState: IModuleStateManager;
    disableGuidedCheckoutFlow?: boolean;
    isMobile?: boolean;
    isEditor?: boolean;
    resource: {
        checkoutStepTitleFormat: string;
        saveBtnLabel: string;
        changeBtnLabel: string;
        cancelBtnLabel: string;
        saveAndContinueBtnLabel: string;
    };
    requestContext?: ICoreContext;
    telemetryContent?: ITelemetryContent;
    isPaymentVerificationRedirection?: boolean;
    shouldEnableSinglePaymentAuthorizationCheckout?: boolean;
    hasError?: boolean;
    hasShippingAddress?: boolean | undefined;
    hasCartDeliveryMode?: boolean | undefined;
    hasGuestCheckoutEmail?: boolean | undefined;
    isTermsAndConditionAccepted?: boolean | undefined;
    shouldEnableCheckoutErrorDisplayMessaging?: boolean;
    shouldFocusOnCheckoutError?: boolean | undefined;
}

interface ICheckoutGuidedFormState {
    currentStep: number;
}

const paymentInstrumentModuleId = 'payment-instrument';

/**
 *
 * CheckoutGuidedForm component.
 * @extends {React.Component<ICheckoutGuidedFormProps>}
 */
@observer
class CheckoutGuidedForm extends React.PureComponent<ICheckoutGuidedFormProps> {
    @computed public get hasMissingInfo(): boolean {
        if (
            this.props.hasShippingAddress === false ||
            this.props.hasCartDeliveryMode === false ||
            this.props.hasGuestCheckoutEmail === false ||
            this.props.isTermsAndConditionAccepted === false
        ) {
            return true;
        }

        return false;
    }

    @computed public get hasOrderError(): boolean {
        for (const item of this.props.items) {
            const childId = this.getId(item);
            const state = this.props.moduleState.getModule(childId);

            const isPaymentSectionContainer = ArrayExtensions.hasElements(
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Explicitly check for null/undefined.
                state.childIds?.filter(currentId => currentId?.includes(paymentInstrumentModuleId))
            );

            if (!isPaymentSectionContainer && !state.isDisabled && state.hasError) {
                return true;
            }
        }

        return false;
    }

    public state: ICheckoutGuidedFormState = {
        currentStep: 0
    };

    public componentDidMount(): void {
        /**
         * Append child modules.
         */
        const childIds = this.props.items.map((item: React.ReactNode) => get(item, 'props.id'));
        this.props.moduleState.init({ childIds });
    }

    public render(): JSX.Element | null {
        const { moduleState, items, resource } = this.props;
        if (!items || !moduleState) {
            return null;
        }

        const shouldCollapseAfterRedirect =
            this.props.isPaymentVerificationRedirection &&
            this.props.shouldEnableSinglePaymentAuthorizationCheckout &&
            !this.props.hasError &&
            !this.hasMissingInfo &&
            !this.hasOrderError;

        let previousModuleHasError = false;
        const childModule = this._enableAfterModule();
        return (
            <div className='ms-checkout__guided-form'>
                {items.map((item: React.ReactNode) => {
                    const childId = this.getId(item);
                    const step = this.getStep(childId);
                    const title = this.getHeading(item);
                    const state = this.props.moduleState.getModule(childId);
                    const {
                        isReady,
                        isPending,
                        isUpdating,
                        isDisabled,
                        isCancelAllowed,
                        onEdit,
                        onCancel,
                        onSubmit,
                        hasModuleState,
                        hasInitialized,
                        hasError
                    } = state || ({} as IModuleStateManager);

                    let shouldFocus =
                        !!this.props.shouldEnableCheckoutErrorDisplayMessaging &&
                        !!this.props.shouldFocusOnCheckoutError &&
                        !previousModuleHasError &&
                        hasError;
                    previousModuleHasError = previousModuleHasError || shouldFocus;

                    return (
                        <GuidedCard
                            id={this.getId(item)}
                            key={childId}
                            step={step}
                            title={title}
                            resource={resource}
                            disabled={!hasModuleState || isDisabled}
                            isActive={!shouldCollapseAfterRedirect && this.isActive(step)}
                            isVisted={!shouldCollapseAfterRedirect && this.isVisted(step)}
                            isExpanded={!shouldCollapseAfterRedirect && this.isExpanded(step, childModule, childId)}
                            isSubmitting={isPending}
                            isMobile={this.props.isMobile}
                            isPending={isPending}
                            isUpdating={isUpdating}
                            hasInitialized={hasInitialized}
                            isReady={isReady}
                            isCancelAllowed={isCancelAllowed}
                            onSubmit={onSubmit}
                            onCancel={onCancel}
                            onEdit={onEdit}
                            onNext={this.onNext}
                            hasControlGroup={!this.props.disableGuidedCheckoutFlow && hasInitialized}
                            telemetryContent={this.props.telemetryContent}
                            moduleState={moduleState}
                            actionContext={this.props.requestContext?.actionContext}
                            shouldFocus={shouldFocus}
                        >
                            {React.cloneElement(item as React.ReactElement, { enableControl: true })}
                        </GuidedCard>
                    );
                })}
            </div>
        );
    }

    private readonly getEnabledModules = (): string[] => {
        const {
            moduleState: { childIds, getModule }
        } = this.props;
        return childIds.filter((childId: string) => {
            const state = getModule(childId);
            return !!state && !state.isDisabled;
        });
    };

    /**
     * Check if it is a section container with payment module.
     * @param moduleId -- The id of the module.
     * @returns If it is a section container with payment module.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly _enableAfterModule = (): string => {
        const childIds: string[] = this.props.items.map((item: React.ReactNode) => get(item, 'props.id')).filter(Boolean);
        let id: string = '';
        for (let i = 0; i < childIds.length - 1; i++) {
            const childId = childIds[i];
            const nextChildId = childIds[i + 1];
            if (this._isPaymentSectionContainer(childId) && nextChildId) {
                id = nextChildId;
            }
        }
        return id;
    };

    /**
     * Check if it is a section container with payment module.
     * @param moduleId -- The id of the module.
     * @returns If it is a section container with payment module.
     */
    private readonly _isPaymentSectionContainer = (moduleId: string): boolean => {
        const sectionState = this.props.moduleState.getModule(moduleId);
        const isPaymentSectionContainer = ArrayExtensions.hasElements(
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Explicitly check for null/undefined.
            sectionState.childIds?.filter(currentId => currentId?.includes(paymentInstrumentModuleId))
        );

        if (isPaymentSectionContainer) {
            return true;
        }
        return false;
    };

    private readonly getStep = (id: string): number => {
        return this.getEnabledModules().indexOf(id);
    };

    private readonly getId = (item: React.ReactNode): string => {
        return get(item, 'props.id') || '';
    };

    private readonly getHeading = (item: React.ReactNode): Heading => {
        return get(item, 'props.config.heading') || '';
    };

    private readonly isExpanded = (step: number, moduleChildId: string, childId: string): boolean => {
        if (this.props.isEditor) {
            // Editorial mode: Expand all the drawers
            return true;
        }
        if (this.props.shouldEnableSinglePaymentAuthorizationCheckout && moduleChildId === childId) {
            return true;
        }
        return step > -1 && step <= this.state.currentStep;
    };

    private readonly isActive = (step: number): boolean => {
        return step === this.state.currentStep;
    };

    private readonly isVisted = (step: number): boolean => {
        return step > -1 && step < this.state.currentStep;
    };

    private readonly onNext = (): void => {
        this.setState({
            currentStep: this.state.currentStep + 1
        });
    };
}

export default CheckoutGuidedForm;
