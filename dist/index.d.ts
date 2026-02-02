export interface GomamayoOptions {
    higher?: boolean;
    multi?: boolean;
}
export interface GomamayoMatch {
    words: [string, string];
    readings: [string, string];
    degree: number;
    position: number;
}
export interface GomamayoResult {
    isGomamayo: boolean;
    matches: GomamayoMatch[];
    degree: number;
    ary: number;
    input: string;
    reading: string;
}
export declare function analyze(input: string, options?: GomamayoOptions): Promise<GomamayoResult>;
export declare function isGomamayo(input: string, options?: GomamayoOptions): Promise<boolean>;
export declare function find(input: string, options?: GomamayoOptions): Promise<GomamayoMatch[] | null>;
declare const _default: {
    analyze: typeof analyze;
    isGomamayo: typeof isGomamayo;
    find: typeof find;
};
export default _default;
