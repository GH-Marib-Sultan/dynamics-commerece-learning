/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

import * as React from 'react';
import { IMaribFirstContainerViewProps } from './marib-first-container';

export default (props: IMaribFirstContainerViewProps) => {
    return (
        <div className='row'>
            {props.slots.slot1[0]}
            {props.slots.slot2[0]}
            {/* <h2>Config Value: {props.config.showText}</h2> */}
            {/* <h2>Resource Value: {props.resources.resourceKey}</h2> */}
        </div>
    );
};
