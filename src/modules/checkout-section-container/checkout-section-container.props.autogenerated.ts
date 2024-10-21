/**
 * Copyright (c) Microsoft Corporation
 * All rights reserved. See License.txt in the project root for license information.
 * ICheckoutSectionContainer containerModule Interface Properties
 * THIS FILE IS AUTO-GENERATED - MANUAL MODIFICATIONS WILL BE LOST
 */

import * as Msdyn365 from '@msdyn365-commerce/core';
import * as React from 'react';

export const enum width {
    container = 'container',
    fluid = 'fluid'
}

export interface ICheckoutSectionContainerConfig extends Msdyn365.IModuleConfig {
    heading?: IHeadingData;
    width?: width;
    className?: string;
    clientRender?: boolean;
}

export const enum HeadingTag {
    h1 = 'h1',
    h2 = 'h2',
    h3 = 'h3',
    h4 = 'h4',
    h5 = 'h5',
    h6 = 'h6'
}

export interface IHeadingData {
    text: string;
    tag?: HeadingTag;
}

export interface ICheckoutSectionContainerProps<T> extends Msdyn365.IModule<T> {
    config: ICheckoutSectionContainerConfig;
    slots: {
        primary: React.ReactNode[];
    };
}
