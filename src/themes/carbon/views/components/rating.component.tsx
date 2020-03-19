import React, { useEffect, useState } from 'react';

import { IComponent, IComponentProps, msdyn365Commerce } from '@msdyn365-commerce/core';

export interface IRatingComponentProps extends IComponentProps<{}> {
    readOnly: boolean;
    ariaLabel: string;
    avgRating: number;
    ratingCount?: string;
    initialRating?: number;
    hideCount?: boolean;
    className?: string;
    onChange?(value: number): void;
}
export interface IRatingComponent extends IComponent<IRatingComponentProps> {
    onSliderChanged(): (event: React.ChangeEvent<HTMLInputElement>, props: IRatingComponentProps, setRating: (rating: IRatingState) => void) => void;
    onMouseOver(): (event: React.MouseEvent<HTMLElement>, rating: IRatingState, setRating: (rating: IRatingState) => void) => void;
    onClick(): (event: React.MouseEvent<HTMLElement>, props: IRatingComponentProps, setRating: (rating: IRatingState) => void) => void;
    onMouseLeave(): (event: React.MouseEvent, rating: IRatingState, setRating: (rating: IRatingState) => void) => void;
}

interface IRatingState {
    rating: number;
    lastSelectedRating: number;
}

const roundUpMin: number = 0.75;
const roundMidMin: number = 0.25;
const maxRating: number = 5;

const RatingComponentActions = {
    onSliderChanged(event: React.ChangeEvent<HTMLInputElement>, props: IRatingComponentProps, setRating: (rating: IRatingState) => void): void {
        const value = parseInt(event.target.value, 10);
        setRating({ rating: value, lastSelectedRating: value });

        if (props.onChange) {
            props.onChange(value);
        }
    },
    onMouseLeave(_event: React.MouseEvent, rating: IRatingState, setRating: (rating: IRatingState) => void): void {
        setRating({ rating: rating.lastSelectedRating, lastSelectedRating: rating.lastSelectedRating });

    },
    onMouseOver(event: React.MouseEvent<HTMLElement>, rating: IRatingState, setRating: (rating: IRatingState) => void): void {
        setRating({ rating: getIndex(event), lastSelectedRating: rating.lastSelectedRating });
    },
    onClick(event: React.MouseEvent<HTMLElement>, props: IRatingComponentProps, setRating: (rating: IRatingState) => void): void {
        if (!props.readOnly) {
            const index = getIndex(event);
            setRating({ rating: index, lastSelectedRating: index });

            if (props.onChange) {
                props.onChange(index);
            }
        }
    }
};

const Rating: React.FC<IRatingComponentProps> = (props: IRatingComponentProps) => {
    const initialRating = props.readOnly ? props.avgRating : props.initialRating || 0;
    const [rating, setRating] = useState({ rating: initialRating, lastSelectedRating: initialRating });
    useEffect(
        () => {
            const newRating = props.readOnly ? props.avgRating : props.initialRating || 0;
            setRating({ rating: newRating, lastSelectedRating: newRating });
        },
        [props]
    );
    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => RatingComponentActions.onSliderChanged(event, props, setRating);
    const onMouseLeave = (event: React.MouseEvent) => RatingComponentActions.onMouseLeave(event, rating, setRating);
    const onMouseOver = (event: React.MouseEvent<HTMLElement>) => RatingComponentActions.onMouseOver(event, rating, setRating);
    const onClick = (event: React.MouseEvent<HTMLElement>) => RatingComponentActions.onClick(event, props, setRating);

    return (
        <div className={`msc-rating  ${rating.rating > 0 ? 'msc-no-ratings' : ''} ${props.className ? props.className : ''}`}>
            TIGER
            {starControl(props.readOnly, rating.rating, props.ariaLabel, onChange)}
            <div aria-hidden={true} onMouseLeave={props.readOnly ? undefined : onMouseLeave} className='msc-rating__group'>
                {renderStars(rating.rating, props, onMouseOver, onClick)}
            </div>
            {props.ratingCount && <output tabIndex={-1} aria-hidden={true} className='msc-rating__count'> {props.typeName === 'reviews-list' ? `${props.avgRating} / 5 (${props.ratingCount})` : props.ratingCount} </output>}
        </div>
    );
};

// Set default props
Rating.defaultProps = {
    avgRating: 0
} as Partial<IRatingComponentProps>;

const starControl = (readOnly: boolean, currentRating: number, ariaLabel: string, onChange: (event: React.ChangeEvent<HTMLInputElement>) => void): JSX.Element => {
    if (readOnly) {
        return <div className='msc-rating__range sr-only'>{ariaLabel}</div>;
    }

    return (
        <input
            type='range'
            className='msc-rating__range'
            min={0}
            max={5}
            step={1}
            value={currentRating}
            aria-valuemax={5}
            aria-valuemin={0}
            aria-valuenow={currentRating}
            onChange={onChange}
            aria-label={ariaLabel}
        />
    );
};

const renderStars = (rating: number, props: IRatingComponentProps, mouseOver: (event: React.MouseEvent<HTMLElement>) => void, onClick: (event: React.MouseEvent<HTMLElement>) => void): JSX.Element[] => {
    const floor = Math.floor(rating);
    const remainder = rating - floor;
    const filled = remainder < roundUpMin ? floor : floor + 1;
    const half = roundMidMin <= remainder && remainder < roundUpMin ? filled + 1 : 0;
    const stars = [];

    for (let i = 1; i <= maxRating; i++) {
        const glyphClass = filled >= i ? 'msc-rating__star' : half === i ? 'msc-rating__half-star' : 'msc-rating__empty-star'!;
        stars.push(<span className={glyphClass} data-index={i} key={i} onMouseOver={props.readOnly ? undefined : mouseOver} onClick={onClick} role='presentation' />);
    }

    return stars;
};

const getIndex = (event: React.MouseEvent<HTMLElement>): number => {
    const target = event.target as HTMLElement;
    return parseInt(target.getAttribute('data-index')!, 10);
};

// @ts-ignore
export default Rating
//  RatingComponent: React.FunctionComponent<IRatingComponentProps> = msdyn365Commerce.createComponent<IRatingComponent>(
//     'Rating',
//     { component: Rating, ...RatingComponentActions }
// );