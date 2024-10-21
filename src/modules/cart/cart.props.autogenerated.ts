/**
 * Copyright (c) Microsoft Corporation
 * All rights reserved. See License.txt in the project root for license information.
 * ICart containerModule Interface Properties
 * THIS FILE IS AUTO-GENERATED - MANUAL MODIFICATIONS WILL BE LOST
 */

import * as Msdyn365 from '@msdyn365-commerce/core';
import * as React from 'react';

export interface ICartConfig extends Msdyn365.IModuleConfig {
    showOutOfStockErrors?: boolean;
    showShippingChargesForLineItems?: boolean;
    imageSettings?: Msdyn365.IImageSettings;
    showAvailablePromotions?: boolean;
    clientRender?: boolean;
    showGuestCheckoutButton?: boolean;
}

export interface ICartResources {
    pickUpAtStoreWithLocationText: string;
    bopisSelectAStore: string;
    orLabel: string;
    backToShopping: string;
    outOfStockErrorMessageHeader: string;
    outOfStockErrorMessage: string;
    errorMessageOutOfRangeOneLeft: string;
    errorMessageOutOfRangeFormat: string;
    cartTitle: string;
    emptyCartText: string;
    failToGetCartText: string;
    removeCartButtonText: string;
    cartRemoveButtonAriaLabel: string;
    pickUpAtStoreText: string;
    pickUpText: string;
    shippingText: string;
    emailshippingText: string;
    waitingClass: string;
    decrementButtonAriaLabel: string;
    incrementButtonAriaLabel: string;
    inputQuantityAriaLabel: string;
    discountStringText: string;
    saveForLaterText: string;
    nameOfWishlist: string;
    productDimensionTypeColor: string;
    productDimensionTypeSize: string;
    productDimensionTypeStyle: string;
    productDimensionTypeAmount: string;
    productDimensionTypeConfiguration: string;
    shipInsteadDisplayText: string;
    changeStoreDisplayText: string;
    quantityDisplayText: string;
    shipToAddressDisplayText: string;
    pickItUpDisplayText: string;
    payInvoicesDisplayText: string;
    totalSavingsText: string;
    originalPriceText: string;
    currentPriceText: string;
    cartLoadingErrorMessage: string;
    orderSummaryTitle: string;
    invoiceSummaryTitle: string;
    invoiceLabel: string;
    itemsWithCountLabel: string;
    estimatedShippingLabel: string;
    shippingCharges: string;
    priceFree: string;
    estimatedTaxLabel: string;
    totalAmountLabel: string;
    totalSavings: string;
    conditionsText: string;
    yetToBeCalculatedText: string;
    orderTotal: string;
    otherCharges: string;
    notApplicationForCartOrderSummary: string;
    totalDiscountsLabel: string;
    guestCheckoutButtonTitle: string;
    checkoutButtonTitle: string;
    backToShoppingButtonTitle: string;
    addToWishlistButtonText: string;
    removeFromWishlistButtonText: string;
    defaultWishlistName: string;
    promoCodeHeadingText: string;
    promoPlaceholderText: string;
    promoCodeApplyButtonText: string;
    removePromoAriaLabelFormat: string;
    removePromoText: string;
    appliedPromoCodeHeadingText: string;
    invalidPromoCodeErrorText: string;
    failedToAddPromoCodeErrorText: string;
    failedToRemovePromoCodeErrorText: string;
    duplicatePromotionErrorText: string;
    createOrderTemplateFromCartButton: string;
    createOrderTemplateFromCartButtonTooltip: string;
    addToOrderTemplateButtonTooltip: string;
    createOrderTemplateHeader: string;
    orderTemplateTitle: string;
    orderTemplateNameAriaLabel: string;
    createOrderTemplateDescription: string;
    createNewOrderTemplateButtonText: string;
    createOrderTemplateButtonText: string;
    cancelNewOrderTemplateCreationButtonText: string;
    defaultOrderTemplateName: string;
    addToOrderTemplateHeader: string;
    noOrderTemplatesMessage: string;
    noOrderTemplatesDescription: string;
    createAnOrderTemplateButtonText: string;
    cancelOrderTemplateCreationButtonText: string;
    selectTemplatesText: string;
    addToTemplateButtonText: string;
    lineItemsText: string;
    addToOrderTemplateButtonText: string;
    addToOrderTemplateMessage: string;
    addItemToOrderTemplateError: string;
    viewOrderTemplateButtonText: string;
    continueShoppingButtonText: string;
    linesAddedToOrderTemplateHeaderItemsOneText: string;
    linesAddedToOrderTemplateHeaderItemsFormatText: string;
    linesAddedToOrderTemplateHeaderLinesOneText: string;
    linesAddedToOrderTemplateHeaderLinesFormatText: string;
    linesAddedToOrderTemplateHeaderMessageText: string;
    linesAddedToOrderTemplateCustomPriceAlertMessageText: string;
    itemAddedToOrderTemplateHeaderItemOneText: string;
    itemAddedToOrderTemplateHeaderItemFormatText: string;
    itemAddedToOrderTemplateHeaderMessageText: string;
    freePriceText: string;
    duplicatedProductsHeader: string;
    duplicatedProductsDescription: string;
    updateQuantityButtonText: string;
    cancelDuplicateItemsButtonText: string;
    promotionStringHeading: string;
    promotionLinkText: string;
    promotionPopupHeading: string;
    promotionCloseButtonAriaLabel: string;
    itemLabel: string;
    itemsLabel: string;
    titleSeparate: string;
    priceEditorInputAriaLabel: string;
    specifyAmountButtonText: string;
    payFullAmountButtonText: string;
    salesAgreementPricePrompt: string;
    checkoutBlockedDueToUnavailableFundsTitle: string;
    checkoutBlockedDueToUnavailableFundsMessage: string;
}

export interface ICartProps<T> extends Msdyn365.IModule<T> {
    resources: ICartResources;
    config: ICartConfig;
    slots: {
        storeSelector: React.ReactNode[];
        paymentExpress: React.ReactNode[];
    };
}
