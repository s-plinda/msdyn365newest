/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

/* eslint-disable no-duplicate-imports */
import * as React from 'react';

interface IAlertProps {
    message: string;
}

const CheckoutAlert: React.FC<IAlertProps> = ({ message }) => (
    <p className='ms-checkout__error-message' role='alert' aria-live='assertive'>
        {message}
    </p>
);

export default CheckoutAlert;
