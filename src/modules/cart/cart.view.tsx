/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import MsDyn365 from '@msdyn365-commerce/core';
import { IInvoiceSummaryLines } from '@msdyn365-commerce-modules/invoice-payment-summary';
import { IOrderSummaryLines } from '@msdyn365-commerce-modules/order-summary-utilities';
import { ArrayExtensions, StringExtensions } from '@msdyn365-commerce-modules/retail-actions';
import { INodeProps, Node } from '@msdyn365-commerce-modules/utilities';
import * as React from 'react';

import { ICartViewProps, IOrderSummaryErrors } from './cart';
import { ICartlinesViewProps } from './components/cart-line-items';
import { ICartLineItemViewProps } from './components/cart-line-items-promotion';

const _renderCartlines = (
    cartLines: ICartlinesViewProps[] | undefined,
    cartEmptyText: string,
    CartlinesWrapper: INodeProps,
    storeSelector: React.ReactNode | undefined,
    backToShoppingButton: React.ReactNode,
    waitingComponent: React.ReactNode,
    cartLoadingStatus: string,
    cartDataResult: boolean
): JSX.Element[] | JSX.Element => {
    if (cartLoadingStatus) {
        return <>{cartLoadingStatus}</>;
    }
    if (cartLines) {
        return cartLines.map(cartLine => {
            return (
                <div className='msc-cart-lines-item' key={`${cartLine.cartlineId ?? ''}-${MsDyn365.isBrowser.toString()}`}>
                    {cartLine.cartline}
                    {storeSelector && cartLine.pickUpInStore ? (
                        <Node {...cartLine.pickUpInStore.ContainerProps}>{cartLine.pickUpInStore.defaultComponent}</Node>
                    ) : null}
                    {cartLine.addToOrderTemplate ? (
                        <Node className='msc-cart-line__extra-actions'>
                            {cartLine.remove}
                            {cartLine.addToWishlist}
                            {cartLine.addToOrderTemplate}
                        </Node>
                    ) : (
                        <>
                            {cartLine.remove}
                            {cartLine.addToWishlist}
                        </>
                    )}
                </div>
            );
        });
    }
    return cartDataResult ? (
        <div className='msc-cart__empty-cart'>
            <p className='msc-cart-line'>{cartEmptyText}</p>
            {backToShoppingButton}
        </div>
    ) : (
        <>{waitingComponent}</>
    );
};

/**
 * Method will render error block.
 * @param errorData -The order summary errors interface.
 * @returns Jsx element.
 */
const _renderErrorBlock = (errorData: IOrderSummaryErrors | undefined): JSX.Element | null => {
    if (!errorData || !ArrayExtensions.hasElements(errorData.errors)) {
        return null;
    }
    return (
        <Node {...errorData.Wrapper}>
            {errorData.header}
            {errorData.errors}
        </Node>
    );
};

/**
 * Method will render invoice summary lines.
 * @param invoiceSummaryLines -The invoicesummary lines interface.
 * @param OrderSummaryItems -The order summary items props.
 * @param props -The cartview props.
 * @returns Jsx element.
 */
const _renderInvoiceSummarylines = (
    invoiceSummaryLines: IInvoiceSummaryLines | undefined,
    OrderSummaryItems: INodeProps,
    props: ICartViewProps
): JSX.Element | null => {
    if (!invoiceSummaryLines) {
        props.context.telemetry.error('InvoiceSummary content is empty, module wont render');
        return null;
    }
    return (
        <Node {...OrderSummaryItems}>
            {invoiceSummaryLines.invoices}
            {invoiceSummaryLines.giftCard}
            {invoiceSummaryLines.loyalty}
            {invoiceSummaryLines.orderTotal}
        </Node>
    );
};

/**
 * Method will render order summary lines.
 * @param orderSummaryLines -The ordersummary lines interface.
 * @param OrderSummaryItems -The order summary items props.
 * @param props -The cartview props.
 * @returns Jsx element.
 */
const _renderOrderSummarylines = (
    orderSummaryLines: IOrderSummaryLines | undefined,
    OrderSummaryItems: INodeProps,
    props: ICartViewProps
): JSX.Element | null => {
    if (!orderSummaryLines) {
        props.context.telemetry.error('OrderSummary content is empty, module wont render');
        return null;
    }
    return (
        <Node {...OrderSummaryItems}>
            {props.promoCode}
            {orderSummaryLines.subtotal}
            {orderSummaryLines.shipping}
            {orderSummaryLines.otherCharge}
            {orderSummaryLines.tax}
            {orderSummaryLines.totalDiscounts ? orderSummaryLines.totalDiscounts : null}
            {orderSummaryLines.orderTotal}
        </Node>
    );
};

/**
 * Method will render cart promotions.
 * @param promotions -The cartline item view props.
 * @returns Jsx element.
 */
const _renderPromotions = (promotions: ICartLineItemViewProps): JSX.Element | undefined => {
    return (
        <>
            <Node {...promotions.promotionMessageWrapper}>
                {promotions.promotionMessage}
                {promotions.promotionSeeAllLink}
                {promotions.promotionDialog}
            </Node>
        </>
    );
};

/**
 * Method will render cartlines group title.
 * @param cartLine -The cartline view props.
 * @param titleSeparate -The title separate.
 * @returns Jsx element.
 */
const renderCartLinesGroupTitle = (cartLine: ICartlinesViewProps, titleSeparate: string) => {
    const isBopisSelected: boolean | undefined = cartLine.pickUpInStore?.isBopisSelected;
    return (
        <>
            <Node className='msc-cart-lines-group-wraper__bopis-heading-title'>
                {isBopisSelected ? (
                    <p className='msc-cart-lines-group-wraper__bopis-heading-title-st'>
                        {cartLine.pickUpInStore?.deliveryOption}
                        {titleSeparate}
                        {cartLine.pickUpInStore?.orgUnitName}
                    </p>
                ) : null}
            </Node>
        </>
    );
};

/**
 * Method will render cartlines groups header title.
 * @param pickUpText -The pickup text for group.
 * @param shippingText -The shipping text for group.
 * @param emailShippingText -The email shipping text for group.
 * @param titleSeparate -The title separator.
 * @param cartLine -The cartline view props.
 * @param emailDeliveryModeCode -The email delivery code from channel.
 * @returns Jsx element.
 */
const renderCartLinesGroupHeader = (
    pickUpText: string,
    shippingText: string,
    emailShippingText: string,
    titleSeparate: string,
    cartLine: ICartlinesViewProps,
    emailDeliveryModeCode?: string
) => {
    const isBopisSelected: boolean | undefined = cartLine.pickUpInStore?.isBopisSelected;
    let groupTitle: string;

    groupTitle = isBopisSelected ? pickUpText : shippingText;
    if (!StringExtensions.isNullOrEmpty(emailDeliveryModeCode)) {
        groupTitle = cartLine.data && cartLine.data.cartline.DeliveryMode === emailDeliveryModeCode ? emailShippingText : groupTitle;
    }

    return (
        <>
            <div className='msc-cart-lines-group-wraper__bopis-heading'>
                <p className={`msc-cart-lines-group-wraper__bopis-heading-${groupTitle.toLowerCase()}-icon`} />
                <p className={`msc-cart-lines-group-wraper__bopis-heading-${groupTitle.toLowerCase()}`}>{groupTitle}</p>
                {renderCartLinesGroupTitle(cartLine, titleSeparate)}
            </div>
        </>
    );
};

/**
 * Method will render cartlines in groups.
 * @param props -The cartline.
 * @returns Jsx element.
 */
const renderCartLinesGroup = (props: ICartViewProps): JSX.Element | undefined => {
    if (props.cartLinesGroup && ArrayExtensions.hasElements(props.cartLinesGroup)) {
        return (
            <div className='msc-cart-lines-group'>
                {props.cartLinesGroup.map(cartlines => {
                    return (
                        <div key={cartlines[0].cartlineId} className='msc-cart-lines-group-wraper'>
                            {renderCartLinesGroupHeader(
                                props.resources.pickUpText,
                                props.resources.shippingText,
                                props.resources.emailshippingText,
                                props.resources.titleSeparate,
                                cartlines[0],
                                props.context.actionContext.requestContext.channel?.EmailDeliveryModeCode
                            )}
                            {_renderCartlines(
                                cartlines,
                                props.resources.emptyCartText,
                                props.CartlinesWrapper,
                                props.storeSelector,
                                props.backToShoppingButton,
                                props.waitingComponent,
                                props.cartLoadingStatus,
                                props.cartDataResult
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }
    return props.cartDataResult ? (
        <div className='msc-cartline-wraper'>
            <div className='msc-cart__empty-cart'>
                <p className='msc-cart-line'>{props.resources.emptyCartText}</p>
                {props.backToShoppingButton}
            </div>
        </div>
    ) : (
        <>{props.waitingComponent}</>
    );
};

const CartView: React.FC<ICartViewProps> = (props: ICartViewProps) => (
    <div className={props.className} id={props.id} {...props.renderModuleAttributes(props)}>
        {props.title}
        {!props.cart?.hasInvoiceLine && props.promotionOptions && _renderPromotions(props.promotionOptions)}
        {props.multiplePickUpEnabled ? (
            renderCartLinesGroup(props)
        ) : (
            <Node {...props.CartlinesWrapper}>
                {_renderCartlines(
                    props.cartlines,
                    props.resources.emptyCartText,
                    props.CartlinesWrapper,
                    props.storeSelector,
                    props.backToShoppingButton,
                    props.waitingComponent,
                    props.cartLoadingStatus,
                    props.cartDataResult
                )}
            </Node>
        )}
        {props.orderSummaryHeading && (
            <Node {...props.OrderSummaryWrapper}>
                {props.orderSummaryHeading}
                {props.cart?.hasInvoiceLine
                    ? _renderInvoiceSummarylines(props.invoiceSummaryLineitems, props.OrderSummaryItems, props)
                    : _renderOrderSummarylines(props.orderSummaryLineitems, props.OrderSummaryItems, props)}
                {_renderErrorBlock(props.OrderSummaryErrors)}
                {props.checkoutAsSignInUserButton}
                {props.checkoutAsGuestButton}
                {props.expressCheckoutButton && ArrayExtensions.hasElements(props.expressCheckoutButton) ? (
                    <Node {...props.ExpressCheckoutSectionWrapper}>{props.expressCheckoutButton}</Node>
                ) : null}
                {props.backToShoppingButton}
                {props.createTemplateFromCartButton}
            </Node>
        )}
        {props.storeSelector}
    </div>
);

export default CartView;
