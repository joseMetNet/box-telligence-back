export interface ImessageComposed {
    translationKey: string,
    translationParams: object
}

export interface IresponseRepositoryService {
    code: number,
    message:  ImessageComposed | string,
    data?: any
}


export type ShipmentRow = {
    orderId: number;
    item1Length: number | null;
    item1Width: number | null;
    item1Height: number | null;
    item1Weight: number | null;
    item2Length: number | null;
    item2Width: number | null;
    item2Height: number | null;
    item2Weight: number | null;
    item3Length: number | null;
    item3Width: number | null;
    item3Height: number | null;
    item3Weight: number | null;
    item4Length: number | null;
    item4Width: number | null;
    item4Height: number | null;
    item4Weight: number | null;
    item5Length: number | null;
    item5Width: number | null;
    item5Height: number | null;
    item5Weight: number | null;
    cubedItemLength: number | null;
    cubedItemWidth: number | null;
    cubedItemHeight: number | null;
    cubedItemWeight: number | null;
    currentAssignedBoxLength: number | null;
    currentAssignedBoxWidth: number | null;
    currentAssignedBoxHeight: number | null;
};