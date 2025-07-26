export default class Store {
    constructor(params: any);
    actions: {};
    mutations: {};
    state: any;
    status: string;
    events: PubSub;
    /**
     * A dispatcher for actions that looks in the actions
     * collection and runs the action if it can find it
     *
     * @param {string} actionKey
     * @param {mixed} payload
     * @returns {boolean}
     * @memberof Store
     */
    dispatch(actionKey: string, payload: mixed): boolean;
    /**
     * Look for a mutation and modify the state object
     * if that mutation exists by calling it
     *
     * @param {string} mutationKey
     * @param {mixed} payload
     * @returns {boolean}
     * @memberof Store
     */
    commit(mutationKey: string, payload: mixed): boolean;
}
import PubSub from '../common/pubsub.js';
