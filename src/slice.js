import { createSlice } from '@reduxjs/toolkit'
import { languageOptions } from './utils/constant';
import { availableThemes } from './utils/constant';

const initialState = {
    code: '',
    languageId: languageOptions[0],
    theme: availableThemes[0],
}

const EditorSlice = createSlice({
    name: 'editor',
    initialState,
    reducers: {
        setCodeReducer(state, action) {
            state.code = action.payload;
        },
        setLanguageReducer(state, action) {
            state.languageId = action.payload;
        },
        setThemeReducer(state, action) {
            state.theme = action.payload;
        }
    }
});

export const { setCodeReducer, setLanguageReducer, setThemeReducer } = EditorSlice.actions;
export default EditorSlice.reducer;