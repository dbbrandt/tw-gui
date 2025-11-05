/* eslint-disable */
// Manage lesson toolbox configuration used to filter toolbox blocks

const SET_LESSON_TOOLBOX_CONFIG = 'scratch-gui/lesson-toolbox/SET_LESSON_TOOLBOX_CONFIG';
const CLEAR_LESSON_TOOLBOX_CONFIG = 'scratch-gui/lesson-toolbox/CLEAR_LESSON_TOOLBOX_CONFIG';

const initialState = {
    config: null // { allowOpcodes: string[], allowCategories: string[] } | null
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_LESSON_TOOLBOX_CONFIG:
        return Object.assign({}, state, { config: action.config });
    case CLEAR_LESSON_TOOLBOX_CONFIG:
        return Object.assign({}, state, { config: null });
    default:
        return state;
    }
};

const setLessonToolboxConfig = function (config) {
    return {
        type: SET_LESSON_TOOLBOX_CONFIG,
        config
    };
};

const clearLessonToolboxConfig = function () {
    return {
        type: CLEAR_LESSON_TOOLBOX_CONFIG
    };
};

export {
    reducer as default,
    initialState as lessonToolboxInitialState,
    setLessonToolboxConfig,
    clearLessonToolboxConfig
};
