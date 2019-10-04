import {Message} from "roslib";
import {Time} from "./builtin";

export class GoalID extends Message {
    /**
     * The stamp should store the time at which this goal was requested.
     * It is used by an action server when it tries to preempt all
     * goals that were requested before a certain time
     */
    stamp: Time;

    /**
     * The id provides a way to associate feedback and
     * result message with specific goal requests. The id
     * specified must be unique.
     */
    id: string;

    constructor(values: {
        stamp?: Time;
        id?: string;
    }) {
        super(values);
    }

}

export class GoalStatus extends Message {
    static readonly PENDING: number = 0;
    static readonly ACTIVE: number = 1;
    static readonly PREEMPTED: number = 2;
    static readonly SUCCEEDED: number = 3;
    static readonly ABORTED: number = 4;
    static readonly REJECTED: number = 5;
    static readonly PREEMPTING: number = 6;
    static readonly RECALLING: number = 7;
    static readonly RECALLED: number = 8;
    static readonly LOST: number = 9;

    goal_id: GoalID;
    status: number;
    /** Allow for the user to associate a string with GoalStatus for debugging */
    text: string;

    constructor(values: {
        goal_id?: GoalID;
        status?: number;
        text?: string;
    }) {
        super(values);
    }

}
