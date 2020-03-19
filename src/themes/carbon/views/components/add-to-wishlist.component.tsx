import classnames from 'classnames';
import * as Popper from 'popper.js';
import React, { useState } from 'react';

import { buildWishlistLine } from '@msdyn365-commerce-modules/retail-actions';
import { Alert, UncontrolledTooltip } from '@msdyn365-commerce-modules/utilities';
import { IComponent, IComponentProps, msdyn365Commerce } from '@msdyn365-commerce/core';
import { AsyncResult, CartLine, CommerceList, ProductDimension, SimpleProduct } from '@msdyn365-commerce/retail-proxy';
import {
    addLinesAsync, createCommerceListAsync, createGetByCustomerInput, removeLinesAsync
} from '@msdyn365-commerce/retail-proxy/dist/DataActions/CommerceListsDataActions.g';

export interface IAddToWishlistComponentProps extends IComponentProps<IAddtoWishlistData> {
    className?: string;
    addToWishlistButtonText: string;
    removeFromWishlistButtonText: string;
    nameOfWishlist: string;

    addToWishlistMessage?: string;
    removedFromWishlistMessage?: string;
    addItemToWishlistError?: string;
    removeItemFromWishlistError?: string;

    showButtonText?: boolean;
    showButtonTooltip?: boolean;
    tooltipPosition?: Popper.Placement;
    showStatusMessage?: boolean;
    showRemoveButton?: boolean;
    disabled?: boolean;
    cartline?: CartLine;
    canAddMasterProduct?: boolean;
    onSuccess?(result: IWishlistActionSuccessResult, cartline?: CartLine): void;
    onError?(result: IWishlistActionErrorResult): void;
}

export interface IWishlistActionSuccessResult {
    status: 'ADDED' | 'REMOVED';
}

export interface IWishlistActionErrorResult {
    status: 'FAILED' | 'MISSINGDIMENSION';

    missingDimensions?: ProductDimension[];
}

interface IAddToWishlistStateManager {
    waiting: boolean;
    canRemove: boolean;
    content: IAddtoWishlistContentState;

    setWaiting(newWaiting: boolean): void;
    setContent(newContent: IAddtoWishlistContentState): void;
    setCanRemove(newCanRemove: boolean): void;
}

interface IAddtoWishlistContentState {
    showAlert?: boolean;
    wishlistTextMessage?: string;
    color?: string;
}

interface IAddtoWishlistData {
    wishlists?: CommerceList[];
    product: SimpleProduct;
}

export interface IAddtoWishlistComponent extends IComponent<IAddToWishlistComponentProps> {
    onClick(): (event: React.MouseEvent<HTMLElement>, props: IAddToWishlistComponentProps, state: IAddToWishlistStateManager) => void;
}

const onClick = async (_event: React.MouseEvent<HTMLElement>, props: IAddToWishlistComponentProps, state: IAddToWishlistStateManager): Promise<void> => {
    const { user } = props.context.request;

    if (state.waiting) {
        return;
    }

    if (!user.isAuthenticated && user.signInUrl && window) {
        window.location.assign(user.signInUrl);

        return;
    }

    state.setWaiting(true);
    await (state.canRemove ? removeFromWishlist(props, state) : addToWishlist(props, state));
    state.setWaiting(false);
};

const onDismiss = (state: IAddToWishlistStateManager): void => {
    state.setContent({ color:'success', showAlert: false });
};

const AddToWishlistComponentActions = {
    onClick: onClick,
    onDismiss: onDismiss
};

const AddToWishlist: React.FC<IAddToWishlistComponentProps> = (props: IAddToWishlistComponentProps) => {
    const [waiting, setWaiting] = useState(false);
    const [canRemove, setCanRemove] = useState(doesProductExistInWishlist(props));
    const [content, setContent] = useState({});
    const state: IAddToWishlistStateManager = {
        waiting,
        canRemove,
        content,

        setWaiting,
        setCanRemove,
        setContent
    };

    React.useEffect(
        () => {
            setCanRemove(doesProductExistInWishlist(props));
        },
        [props]
    );

    const { removeFromWishlistButtonText, addToWishlistButtonText, showStatusMessage, showRemoveButton, showButtonText, className, disabled, showButtonTooltip, tooltipPosition } = props;

    const onClickHandler = (event: React.MouseEvent<HTMLElement>) => { return AddToWishlistComponentActions.onClick(event, props, state); };
    const onDismissHandler = () => { return AddToWishlistComponentActions.onDismiss(state); };
    const ariaLabel = state.canRemove ? removeFromWishlistButtonText : addToWishlistButtonText;
    const addToWishlistRef: React.RefObject<HTMLButtonElement> = React.createRef();
    const removeFromWishlistRef: React.RefObject<HTMLButtonElement> = React.createRef();
    const showMessage = showStatusMessage !== undefined ? showStatusMessage: true;
    const showButton = showRemoveButton !== undefined ? showRemoveButton: true;
    const showTooltip = showButtonTooltip !== undefined ? showButtonTooltip: true;
    const tooltipPos = showButtonTooltip !== undefined ? tooltipPosition: 'right';

    if (state.canRemove && !showButton) {
        return null;
    }

    return (
        <React.Fragment>
            {
                showButtonText ? (
                    <>  This is my commerece component extension
                        <button
                            className={classnames('msc-add-to-wishlist', className, state.waiting ? 'msc-add-to-wishlist__waiting' : '', state.canRemove ? 'msc-add-to-wishlist__removing' : '')}
                            aria-label={ariaLabel}
                            onClick={onClickHandler}
                            disabled={disabled}
                            ref={addToWishlistRef}
                        >
                            {ariaLabel}
                        </button>
                        {
                            showTooltip && <UncontrolledTooltip placement={tooltipPos} trigger={'hover focus'} target={addToWishlistRef}>{ariaLabel}</UncontrolledTooltip>
                        }
                    </>
                ):(
                    <> This is my commerece component extension
                        <button
                            className={classnames('msc-add-to-wishlist', className, state.waiting ? 'msc-add-to-wishlist__waiting' : '', state.canRemove ? 'msc-add-to-wishlist__removing' : '')}
                            aria-label={ariaLabel}
                            onClick={onClickHandler}
                            disabled={disabled}
                            ref={removeFromWishlistRef}
                        />
                        {
                            showTooltip && <UncontrolledTooltip placement={tooltipPos} trigger={'hover focus'} target={addToWishlistRef}>{ariaLabel}</UncontrolledTooltip>
                        }
                    </>
                )
            }
            {
                state.content.showAlert && showMessage ?
                <div className='ms-wishlist-items__product-status'>
                    <Alert color={ state.content.color } isOpen={ state.content.showAlert } toggle={ onDismissHandler }>
                        { state.content.wishlistTextMessage }
                    </Alert>
                </div> :
                ''
            }
        </React.Fragment>
    );
};

const doesProductExistInWishlist = (props: IAddToWishlistComponentProps): boolean => {
    const { wishlists } = props.data;

    if (!wishlists || !wishlists[0]) {
        return false;
    }

    const { CommerceListLines } = wishlists[0];

    if (!CommerceListLines || CommerceListLines.length === 0) {
        return false;
    }

    for (const wishlistItem of CommerceListLines) {
        if (wishlistItem.ProductId === props.data.product.RecordId) {
            return true;
        }
    }

    return false;
};

const propogateSuccess = (props: IAddToWishlistComponentProps, result: IWishlistActionSuccessResult): void => {
    const { onSuccess, cartline } = props;

    if (onSuccess) {
        cartline ? onSuccess(result, props.cartline) : onSuccess(result);
    }
};

const propogateError = (props: IAddToWishlistComponentProps, result: IWishlistActionErrorResult): void => {
    const { onError } = props;

    if (onError) {
        onError(result);
    }
};

const addToWishlist = (props: IAddToWishlistComponentProps, state: IAddToWishlistStateManager): AsyncResult<void> => {
    const { canAddMasterProduct, context, data } = props;
    const { product } = data;

    if (product.Dimensions && !canAddMasterProduct) {
        const missingDimensions = product.Dimensions.filter(dimension => !(dimension.DimensionValue && dimension.DimensionValue.Value));

        if (missingDimensions.length > 0) {
            // At least one dimension with no value exists on the product, won't be able to add to cart
            propogateError(props, { status: 'MISSINGDIMENSION', missingDimensions: missingDimensions });

            return AsyncResult.resolve();
        }
    }

    const userAccountNumber = context.request.user.customerAccountNumber;

    if (userAccountNumber) {
        if (!props.data.wishlists || props.data.wishlists.length === 0) {
            const wishlistName = props.nameOfWishlist;

            const listData: CommerceList = {
                CustomerId: context.request.user.customerAccountNumber,
                Name: wishlistName,
                // This is the type value specifically for a wishlist
                CommerceListTypeValue: 1,
                Id: 0
            };

            return createCommerceListAsync({ callerContext: context.actionContext }, listData)
                .then((commerceList) => {
                    return callAddWishlistLine(props, state, userAccountNumber, commerceList.Id, data.product.RecordId);
                })
                .catch(error => {
                    if (context.telemetry) {
                        context.telemetry.warning(error);
                        context.telemetry.debug('Unable to create a wishlist');
                    }
                    propogateError(props, { status: 'FAILED' });
                });
        } else {
            return callAddWishlistLine(props, state, userAccountNumber, props.data.wishlists[0].Id, data.product.RecordId);
        }
    }

    return AsyncResult.resolve();
};

const callAddWishlistLine = (props: IAddToWishlistComponentProps, state: IAddToWishlistStateManager, userAccountNumber: string, wishlistId: number, productId: number): AsyncResult<void> => {
    const { context } = props;

    return addLinesAsync({ callerContext: context.actionContext }, wishlistId, [buildWishlistLine(productId, userAccountNumber, wishlistId)])
        .then(createdCommerceList => {
            context.actionContext.update(createGetByCustomerInput({}, userAccountNumber), [createdCommerceList]);
            if (context.telemetry) {
                context.telemetry.debug(`Added item to the wishlist ${createdCommerceList}`);
            }
            state.setCanRemove(true);
            state.setContent({color:'success',
                showAlert: true, wishlistTextMessage: props.addToWishlistMessage ? props.addToWishlistMessage:'Added to your wishlist' });
            propogateSuccess(props, { status: 'ADDED' });
        })
        .catch(error => {
            if (context.telemetry) {
                context.telemetry.warning(error);
                context.telemetry.debug(`Unable to add item to wishlist ${error}`);
            }

            state.setContent({color:'danger',
                 showAlert: true, wishlistTextMessage: props.addItemToWishlistError });
            propogateError(props, { status: 'FAILED' });
        });
};

const removeFromWishlist = (props: IAddToWishlistComponentProps, state: IAddToWishlistStateManager): AsyncResult<void> => {
    const { context, data, removedFromWishlistMessage, removeItemFromWishlistError } = props;
    const { wishlists, product } = data;
    const { actionContext, request, telemetry } = context;
    const accountNumber = request.user.customerAccountNumber;

    if (wishlists && wishlists[0]) {
        const wishlistLine = wishlists[0].CommerceListLines!.find(line => line.ProductId === data.product.RecordId);

        if (wishlistLine) {
            return removeLinesAsync({ callerContext: actionContext }, wishlists[0].Id, [wishlistLine])
                .then((commerceList) => {
                    if (accountNumber) {
                        context.actionContext.update(createGetByCustomerInput({}, accountNumber), [commerceList]);
                    }

                    if (telemetry) {
                        telemetry.debug(`[WishlistButton] ${product.RecordId} removed from Wishlist ${commerceList.Id}`);
                    }
                    state.setCanRemove(false);
                    state.setContent({color:'success',
                        showAlert:true, wishlistTextMessage: removedFromWishlistMessage ? removedFromWishlistMessage: `Removed item from the wishlist`});
                    propogateSuccess(props, { status: 'REMOVED' });
                })
                .catch(error => {
                    if (telemetry) {
                        telemetry.warning(error);
                        telemetry.debug('[WishlistButton] Error removing item from the wishlist');
                    }

                    state.setContent({color:'danger',
                         wishlistTextMessage: removeItemFromWishlistError});
                    propogateError(props, { status: 'FAILED' });
                });
        }
    } else {
        if (telemetry) {
            telemetry.debug('[WishlistButton] Can\'t remove from wishlist since no wishlist exisits OR there is no product data');
        }
    }

    return AsyncResult.resolve();
};

// @ts-ignore
export default AddToWishlist
//  AddToWishlistComponent: React.FunctionComponent<IAddToWishlistComponentProps> = msdyn365Commerce.createComponent<IAddtoWishlistComponent>(
//     'AddToWishlist',
//     { component: AddToWishlist, ...AddToWishlistComponentActions }
// );