/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { Module, Node, Waiting } from '@msdyn365-commerce-modules/utilities';
import * as React from 'react';

import {
    ICheckoutViewProps,
    ILineItem,
    ILineItemDeliveryGroup,
    ILineItems,
    IOrderSummary,
    IPickUpAtStore,
    IEmailDelivery,
    IInvoicePaymentSummary
} from './index';

export const PickUpAtStoreComponent: React.FC<IPickUpAtStore> = ({ PickUpAtStore, label, location }) => (
    <Node {...PickUpAtStore}>
        {label}
        {location}
    </Node>
);

export const EmailDeliveryComponent: React.FC<IEmailDelivery> = ({ EmailDelivery, label }) => <Node {...EmailDelivery}>{label}</Node>;

export const LineItemComponent: React.FC<ILineItem> = ({ LineItem, item, pickUpAtStore, emailDelivery }) => (
    <Node {...LineItem}>
        {item}
        {pickUpAtStore && <PickUpAtStoreComponent {...pickUpAtStore} />}
        {emailDelivery && <EmailDeliveryComponent {...emailDelivery} />}
    </Node>
);

export const LineItemGroupComponent: React.FC<ILineItemDeliveryGroup> = ({ LineItemDeliveryGroup, LineItemList, heading, lineItems }) => (
    <Node {...LineItemDeliveryGroup}>
        {heading}
        <Node {...LineItemList}>
            {lineItems.map(lineItem => (
                <LineItemComponent key={lineItem.LineId} {...lineItem} />
            ))}
        </Node>
    </Node>
);

export const LineItemGroupComponentWithMultiplePickUp: React.FC<ILineItemDeliveryGroup> = ({
    LineItemDeliveryGroup,
    LineItemList,
    heading,
    lineItems,
    lineItemWraper,
    lineItemWraperIcon
}) => (
    <Node {...LineItemDeliveryGroup}>
        {lineItemWraperIcon}
        {lineItemWraper}
        {heading}
        <Node {...LineItemList}>
            {lineItems.map(lineItem => (
                <LineItemComponentWithMultiplePickUp key={lineItem.LineId} {...lineItem} />
            ))}
        </Node>
    </Node>
);

export const LineItemComponentWithMultiplePickUp: React.FC<ILineItem> = ({ LineItem, item, pickUpAtStore, emailDelivery }) => (
    <Node {...LineItem}>
        {item}
        {emailDelivery && <EmailDeliveryComponent {...emailDelivery} />}
    </Node>
);

export const PickUpAtStoreComponentWithMultiplePickUp: React.FC<IPickUpAtStore> = ({ PickUpAtStore, label, location }) => (
    <Node {...PickUpAtStore}>
        {label}
        {location}
    </Node>
);

export const LineItemsComponent: React.FC<ILineItems> = ({
    LineItems,
    Header,
    heading,
    editLink,
    itemsForPickup,
    itemsForShip,
    itemsForEmail,
    itemsGroupWithMulitplePickupMode
}) => (
    <Node {...LineItems}>
        <Node {...Header}>
            {heading}
            {editLink}
        </Node>
        {itemsGroupWithMulitplePickupMode === undefined && itemsForPickup && <LineItemGroupComponent {...itemsForPickup} />}
        {itemsGroupWithMulitplePickupMode === undefined && itemsForEmail && <LineItemGroupComponent {...itemsForEmail} />}
        {itemsGroupWithMulitplePickupMode === undefined && itemsForShip && <LineItemGroupComponent {...itemsForShip} />}
        {itemsGroupWithMulitplePickupMode !== undefined
            ? itemsGroupWithMulitplePickupMode.map((item, index) => {
                  return <LineItemGroupComponentWithMultiplePickUp {...item} key={index} />;
              })
            : null}
    </Node>
);

const OrderSummaryComponent: React.FC<IOrderSummary> = ({ heading, lines }) => (
    <div className='msc-order-summary-wrapper'>
        {heading}
        <div className='msc-order-summary__items'>
            {lines && (
                <>
                    {lines.subtotal}
                    {lines.shipping}
                    {lines.otherCharge}
                    {lines.tax}
                    {lines.totalDiscounts}
                    {lines.loyalty}
                    {lines.customerAccount}
                    {lines.giftCard}
                    {lines.orderTotal}
                </>
            )}
        </div>
    </div>
);

const PaymentSummaryComponent: React.FC<IInvoicePaymentSummary> = ({ heading, lines }) => (
    <div className='msc-invoice-summary-wrapper'>
        {heading}
        <div className='msc-invoice-summary__items'>
            {lines && (
                <>
                    {lines.invoices}
                    {lines.giftCard}
                    {lines.loyalty}
                    {lines.orderTotal}
                </>
            )}
        </div>
    </div>
);

const CheckoutView: React.FC<ICheckoutViewProps> = props => {
    const {
        isPaymentVerificationRedirection,
        shouldEnableSinglePaymentAuthorizationCheckout,
        canShow,
        checkoutProps,
        headerProps,
        hasSalesOrder,
        hasInvoiceLine,
        bodyProps,
        mainProps,
        mainControlProps,
        sideProps,
        sideControlFirstProps,
        sideControlSecondProps,
        termsAndConditionsProps,
        orderConfirmation,
        loading,
        alert,
        title,
        guidedForm,
        orderSummary,
        invoicePaymentSummary,
        lineItems,
        placeOrderButton,
        termsAndConditions,
        keepShoppingButton,
        checkoutExpressPaymentContainer,
        checkoutErrorRef
    } = props;

    return (
        <Module {...checkoutProps} ref={checkoutErrorRef}>
            {!hasSalesOrder && !checkoutExpressPaymentContainer && <Node {...headerProps}>{title}</Node>}
            {!hasSalesOrder && isPaymentVerificationRedirection && shouldEnableSinglePaymentAuthorizationCheckout && !alert && !loading && (
                <Waiting className='msc-waiting-circular msc-waiting-lg' />
            )}
            {!hasSalesOrder && (
                <Node {...bodyProps}>
                    {loading}
                    {alert}
                    {canShow && (
                        <>
                            <Node {...mainProps}>
                                {checkoutExpressPaymentContainer}
                                {checkoutExpressPaymentContainer && <Node {...headerProps}>{title}</Node>}
                                {guidedForm}
                                <Node {...termsAndConditionsProps}>{termsAndConditions}</Node>
                                <Node {...mainControlProps}>
                                    {placeOrderButton}
                                    {keepShoppingButton}
                                </Node>
                            </Node>
                            <Node {...sideProps}>
                                {!hasInvoiceLine
                                    ? orderSummary && <OrderSummaryComponent {...orderSummary} />
                                    : invoicePaymentSummary && <PaymentSummaryComponent {...invoicePaymentSummary} />}
                                <Node {...sideControlFirstProps}>
                                    <Node {...termsAndConditionsProps}>{termsAndConditions}</Node>
                                    {placeOrderButton}
                                    {keepShoppingButton}
                                </Node>
                                {lineItems && <LineItemsComponent {...lineItems} />}
                                <Node {...sideControlSecondProps}>
                                    <Node {...termsAndConditionsProps}>{termsAndConditions}</Node>
                                    {placeOrderButton}
                                    {keepShoppingButton}
                                </Node>
                            </Node>
                        </>
                    )}
                </Node>
            )}
            {hasSalesOrder && orderConfirmation}
        </Module>
    );
};

export default CheckoutView;
