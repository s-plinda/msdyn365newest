/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { TelemetryEvent } from '@msdyn365-commerce/core';
import { Button, getPayloadObject, getTelemetryAttributes, ITelemetryContent } from '@msdyn365-commerce-modules/utilities';
import classnames from 'classnames';
import React, { useState } from 'react';

interface ICheckoutPlaceOrderButtonProps {
    canPlaceOrder: boolean;
    checkoutBtnText: string;
    telemetryContent?: ITelemetryContent;
    shouldEnableSinglePaymentAuthorizationCheckout?: boolean;
    isPlaceOrderLoading?: boolean;
    isExpressCheckoutApplied?: boolean;
    isPaymentVerificationRedirection?: boolean;
    placeOrder(): Promise<void>;
}

const buttonsStates: React.Dispatch<React.SetStateAction<boolean>>[] = [];

/**
 * On place order function.
 * @param isBusy -Check is busy.
 * @param canPlaceOrder -Check can place order.
 * @param placeOrder -Place order function.
 * @returns Set state of button.
 */
const onPlaceOrderHandler = (isBusy: boolean, canPlaceOrder: boolean, placeOrder: () => Promise<void>) => async () => {
    if (isBusy || !canPlaceOrder) {
        return;
    }
    buttonsStates.map(buttonSetState => {
        buttonSetState(true);
        return true;
    });
    await placeOrder();
};

const CheckoutPlaceOrderButton: React.FC<ICheckoutPlaceOrderButtonProps> = ({
    checkoutBtnText,
    canPlaceOrder,
    placeOrder,
    telemetryContent,
    shouldEnableSinglePaymentAuthorizationCheckout,
    isPlaceOrderLoading,
    isExpressCheckoutApplied,
    isPaymentVerificationRedirection
}) => {
    const [isBusy, setIsBusy] = useState(false);
    buttonsStates.push(setIsBusy);
    const payload = getPayloadObject(TelemetryEvent.Purchase, telemetryContent!, checkoutBtnText, '');
    const attributes = getTelemetryAttributes(telemetryContent!, payload);

    if (shouldEnableSinglePaymentAuthorizationCheckout && (!isExpressCheckoutApplied || isPaymentVerificationRedirection)) {
        return (
            <Button
                className={classnames('ms-checkout__btn-place-order', { 'is-busy': isPlaceOrderLoading ?? false })}
                color='primary'
                onClick={placeOrder}
                title={checkoutBtnText}
                {...attributes}
                disabled={!canPlaceOrder || isPlaceOrderLoading}
            >
                {checkoutBtnText}
            </Button>
        );
    }

    return (
        <Button
            className={classnames('ms-checkout__btn-place-order', { 'is-busy': isBusy })}
            color='primary'
            onClick={onPlaceOrderHandler(isBusy, canPlaceOrder, placeOrder)}
            title={checkoutBtnText}
            {...attributes}
            disabled={!canPlaceOrder || isBusy}
        >
            {checkoutBtnText}
        </Button>
    );
};

export default CheckoutPlaceOrderButton;
