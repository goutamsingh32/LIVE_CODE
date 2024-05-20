import React, { useEffect, useRef, useState } from 'react'
import MonacoEditor from '@monaco-editor/react';
import { Select, Input } from "antd";
import ACTIONS from '../Actions';
import { languageOptions } from '../utils/constant';
import { availableThemes } from '../utils/constant';
import { useDispatch, useSelector } from 'react-redux'
import { setCodeReducer, setLanguageReducer, setThemeReducer } from '../slice';
import toast from 'react-hot-toast';
import { submitCode } from '../service';

const { TextArea } = Input

const Editor = ({ socketRef, roomId, onCodeChange }) => {

  const dispatch = useDispatch();

  const [language, setLanguage] = useState(languageOptions[0]);
  const [theme, setTheme] = useState(availableThemes[0]);
  const [code, setCode] = useState("//Write your code here");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompilationAllowed, setIsCompilationAllowed] = useState(false);
  const [customInput, setCustomInput] = useState(null);
  const [outputDetails, setOutputDetails] = useState(null);

  //Listen to CODE_CHANGE event from server
  useEffect(() => {
    if (socketRef && socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null)
          // editorRef.current.setValue(code);
          setCode(code);
      })
    }
    return () => {
      // unsubscribe from all listeners
      socketRef.current.off(ACTIONS.CODE_CHANGE); //TODO
    }
  }, [socketRef.current]);


  /**
   * Used to filter dropdown of language on input selection
   * @param {string} input 
   * @param {import('../utils/constant').LanguageOption} options 
   */
  const filterLanguageOptions = (input, options) => {
    return (options.label || '').toLowerCase().includes(input.toLowerCase());
  }

  /**
   * Handle language selection changes
   * @param {import('../utils/constant').LanguageOption} selectedLanguage 
   */
  const handleLanguageChange = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    dispatch(setLanguageReducer(selectedLanguage)); //TODO
  }

  /**
   * Handle theme change
   * @param {import('../utils/constant').availableThemes} selectedTheme 
   */
  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
    dispatch(setThemeReducer(selectedTheme)); //TODO
  }

  /**
   * Handle code change in editor and emit event to room, and update local storage
   * @param {string} value 
   */
  const handleCodeChange = (value) => {
    setCode(value);
    // dispatch(setCodeReducer(value)); //TODO
    if (socketRef) {
      socketRef.current.emit(ACTIONS.CODE_CHANGE, {
        roomId,
        code: value
      });
    }
    onCodeChange(value) //TODO

    //TODO socket emit
  }

  /**
   * Compile code in current state of the editor
   * @param {string} existingRequestToken Token to be sent back to backend to recheck status of existing request
   */
  const handleCodeCompile = async (existingRequestToken = null) => {
    setIsLoading(true);
    setIsCompilationAllowed(false);
    const payload = {
      language_id: language.id,
      source_code: code,
      stdin: customInput
    }
    payload['token'] = null;
    if (existingRequestToken) {
      payload['token'] = existingRequestToken;
    }
    await toast.promise(
      submitCode(payload),
      {
        loading: 'Processing ⏳',
        success: (apiResponse) => {
          console.log('apiResponse', apiResponse)
          const submissionsResponse = apiResponse?.data;
          if (submissionsResponse && submissionsResponse.status == 'success') {
            const submissionOutput = submissionsResponse; //TODO
            const statusId = submissionOutput?.status?.id;
            if (statusId === 1 || statusId === 2) {
              //Still processing
              setTimeout(() => {
                handleCodeCompile(submissionOutput?.token);
              }, 2000)
              return 'Processing ⏳';
            } else {
              setIsLoading(false);
              setIsCompilationAllowed(true);
              setOutputDetails({ ...submissionOutput, token: null });
              return 'Compilation successful'
            }
          } else {
            throw 'Something went wrong';
          }
        },
        error: (err) => {
          setIsLoading(false);
          console.log('submissionsResponse', err)
          return 'Code compilation & execution failed';
        },
        duration: { loading: 1500, success: 2000, error: 3000 }
      }
    )

  }

  /**
    * Generate UI changes based on code execution results
    */
  const getCodeExecutionResult = () => {
    const statusId = outputDetails?.status?.id;
    if (statusId === 6) {
      const compilationErr = atob(outputDetails?.compile_output);
      // compilation error
      return (
        <pre className="text-red-500">
          {compilationErr ? `${compilationErr}` : null}
        </pre>
      );
    } else if (statusId === 3) {
      const output = atob(outputDetails.stdout);
      return (
        <pre className="text-green-500">
          {output !== null ? `${output}` : null}
        </pre>
      );
    } else if (statusId === 5) {
      return (
        <pre className="text-red-500">
          {`Time Limit Exceeded`}
        </pre>
      );
    } else {
      const stdErr = atob(outputDetails?.stderr);
      return (
        <pre className="text-red-500">
          {stdErr ? `${stdErr}` : null}
        </pre>
      );
    }
  }

  return (
    <div className='editor-wrapper'>

      <div className='editor-section'>
        <div className='select-options'>

          {/* Language selection */}
          <Select
            placeholder="Select language"
            value={language.value}
            showSearch
            style={{ width: '220px' }}
            options={languageOptions}
            onChange={(_, language) => handleLanguageChange(language)} //TODO optionFilterProp
            filterOption={filterLanguageOptions}
          />

          {/* Theme selection */}

          <Select
            style={{ margin: '0px 15px' }}
            placeholder="Select theme"
            value={theme.value}
            options={availableThemes}
            onChange={(_, theme) => handleThemeChange(theme)}
          />
        </div>

        <div className='editor'>
          {/* Editor */}
          <MonacoEditor
            defaultValue="// some comment"
            language={language.value}
            theme={theme.value}
            value={code}
            onChange={handleCodeChange}
            options={
              {
                wordWrap: 'on',
                selectOnLineNumbers: true,
                acceptSuggestionOnEnter: 'on',
                autoClosingBrackets: 'always',
                cursorBlinking: 'blink',
                autoClosingQuotes: 'always',
              }
            }
          />
        </div>
      </div>

      <div style={{ width: '100%', marginRight: '18px' }}>
        <div className='output-head'>
          <h2>Output</h2>
          <span
            className='compile-btn'
            onClick={() => handleCodeCompile(null)}
          >
            Compile & Run
          </span>
        </div>
        <div className='outputResult'>
          <>{outputDetails ? getCodeExecutionResult : null}</>
        </div>
        <div className='customInput'>
          <TextArea
            // value={customInput}
            // onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Custom input"
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </div>

        <div className="outputDetails">
          {outputDetails &&
            <>
              <p className="">
                Status:{" "}
                <span className="">
                  {outputDetails?.status?.description}
                </span>
              </p>
              <p className="">
                Memory:{" "}
                <span className="">
                  {outputDetails?.memory}
                </span>
              </p>
              <p className="">
                Time:{" "}
                <span className="">
                  {outputDetails?.time}
                </span>
              </p>
            </>
          }
        </div>

      </div>
    </div>
  )
}

export default Editor