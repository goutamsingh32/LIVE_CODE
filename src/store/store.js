import { configureStore } from '@reduxjs/toolkit';
import EditorSlice from '../slice';
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage';

const persistConfig = {
    key: 'persist-store',
    storage
}

const persistedReducer = persistReducer(persistConfig, EditorSlice);
const store = configureStore({
    reducer: persistedReducer
})

export const persistor = persistStore(store);
export default store;
