import { atom } from 'recoil';

export const selectedNodeState = atom({
    key: 'selected-node',
    default: undefined,
});