import { ViewContainerRef } from '@angular/core';
import { SlideOverOpeningDirection } from 'app/shared/slide-over/slide-over-opening-direction.enum';

export interface SlideOverConfig {
    /** The view container to place the slider into */
    viewContainerRef?: ViewContainerRef;
    openingDirection: SlideOverOpeningDirection;
    /** Extra CSS classes to be added to the SlideOver container */
    extraClasses?: string | string[];
}
