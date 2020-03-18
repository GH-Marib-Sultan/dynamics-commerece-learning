/*!
 * Copyright (c) Microsoft Corporation.
 * All rights reserved. See LICENSE in the project root for license information.
 */

import * as React from 'react';
import { IMaribFirstContentViewProps } from './marib-first-content';

export default (props: IMaribFirstContentViewProps) => {
    return (
        <div className='row'>
            <h2>Config Value: {props.config.showText}</h2>
            {/* <h2>Resource Value: {props.resources.resourceKey}</h2> */}
        </div>
    );
};
