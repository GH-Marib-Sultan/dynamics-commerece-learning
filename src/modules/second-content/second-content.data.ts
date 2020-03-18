import { AsyncResult } from '@msdyn365-commerce/retail-proxy/dist/async-result';
import { ISecondGetProductReviewsData } from '../../actions/second-get-product-reviews';
import { SimpleProduct } from '@msdyn365-commerce/retail-proxy/dist/Entities/CommerceTypes.g';

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface ISecondContentData {
    actionResponse: {text: string};
    customDAResponse: AsyncResult<ISecondGetProductReviewsData>;
    products: AsyncResult<SimpleProduct>[];
}
