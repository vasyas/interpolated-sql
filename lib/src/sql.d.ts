export interface Count {
    count: number;
}
export interface Page<R, T extends Count = Count> {
    rows: R[];
    totals: T;
}
export interface PageRequest {
    page?: number;
    size?: number;
    sort?: string;
    order?: string;
}
export declare type ConnectionSupplier = () => any;
export declare class Sql {
    private params;
    private connectionSupplier;
    parts: string[];
    constructor(parts: any, params: any, connectionSupplier?: ConnectionSupplier);
    /** Replace array params (i.e. in(${[1, 2]})) with multiple params, b/c node-mysql2 doesn't support it */
    private handleArrayParams();
    append(right: string | Sql, connectionSupplier?: ConnectionSupplier): Sql;
    wrap(left: Sql, right: Sql): Sql;
    count(): Promise<number>;
    aggregate<T extends {
        [x: string]: string;
    }>(aggregations: T): Promise<{
        [x in keyof T]: number;
    }>;
    one(def?: any): Promise<any>;
    scalar(): Promise<any>;
    private prepareQueryParams();
    private prepareQuery();
    all(): Promise<any[]>;
    private convertTypesOnReading(rows, fields);
    insert(): Promise<number>;
    update(): Promise<number>;
    page(request: PageRequest, totalAggregations?: {
        count: string;
        [x: string]: string;
    }): Promise<Page<any>>;
}
export declare function sql(parts: any, ...params: any[]): Sql;
export declare function enableTrace(enabled: any): void;
