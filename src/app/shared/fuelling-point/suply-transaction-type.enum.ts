export enum SuplyTransactionType {
    PostpaidLockedByOwnPOS,
    PostpaidLockedByOtherPOS,
    PostpaidNoLocked,

    PrepaidCompleteLockedByOwnPOS,
    PrepaidCompleteLockedByOtherPOS,
    PrepaidCompleteNotLocked,

    WayletpaidCompleteLockedByOwnPOS,
    WayletpaidCompleteLockedByOtherPOS,
    WayletpaidCompleteNotLocked,

    PrepaidParcialLockedByOwnPOS,
    PrepaidParcialLockedByOtherPOS,
    PrepaidParcialNotLocked,

    Other
}
