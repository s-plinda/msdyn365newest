/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import { CartPromotionLine } from '@msdyn365-commerce/retail-proxy';
import { ArrayExtensions } from '@msdyn365-commerce-modules/retail-actions';
import { INodeProps, Modal, ModalBody, ModalFooter, ModalHeader } from '@msdyn365-commerce-modules/utilities';
import React from 'react';

export interface ICartLineItemPromotion {
    id: string;
    showPromotionPopup: boolean;
    promotions: CartPromotionLine[] | undefined;
    resources: ICartLineItemPromotionResourceString;
    onSeeAllClick(event: React.MouseEvent<HTMLElement>): void;
    onCloseButtonClick(): void;
}

export interface ICartLineItemViewProps {
    promotionMessageWrapper: INodeProps;
    promotionMessage: React.ReactNode;
    promotionSeeAllLink: React.ReactElement;
    promotionDialog: React.ReactNode;
}

export interface ICartLineItemPromotionResourceString {
    promotionLinkText: string;
    promotionStringHeading: string;
    promotionPopupHeading: string;
    promotionCloseButtonAriaLabel: string;
}

export const cartPromotions = (props: ICartLineItemPromotion): ICartLineItemViewProps | undefined => {
    const {
        id,
        showPromotionPopup,
        promotions,
        resources: { promotionLinkText, promotionPopupHeading },
        onCloseButtonClick,
        onSeeAllClick
    } = props;

    if (!ArrayExtensions.hasElements(promotions)) {
        return;
    }

    const titleId = `${id}_title`;
    const className = 'msc-cart__promotion';
    return {
        promotionMessageWrapper: {
            className: 'msc-cart__promotion'
        },
        promotionMessage: (
            <>
                <span className='msi-promotion-icon' />
                <span> {props.resources.promotionStringHeading}</span>
            </>
        ),
        promotionSeeAllLink: (
            <a className='msc-cart__promotion_link' tabIndex={0} role='link' onClick={onSeeAllClick}>
                {` `}
                {promotionLinkText} {` `}
            </a>
        ),
        promotionDialog: (
            <Modal isOpen={showPromotionPopup} className={`${className}`} toggle={onCloseButtonClick}>
                <ModalHeader className={`${className}__dialog__header`} toggle={onCloseButtonClick}>
                    <h5 id={titleId} className='msc-cart__promotion-popup_title'>
                        {promotionPopupHeading}
                    </h5>
                </ModalHeader>
                <ModalBody className={`${className}__dialog__body`}>
                    <ul>
                        {promotions.map(_promotion => {
                            return (
                                <li className='msc-cart__promotion-popup_name' key={_promotion.LineId}>
                                    {_promotion.Promotion?.OfferName} {` `}
                                </li>
                            );
                        })}
                    </ul>
                </ModalBody>
                <ModalFooter className={`${className}__dialog__footer`} />
            </Modal>
        )
    };
};
