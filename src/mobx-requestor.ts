import { action, computed, makeObservable, observable } from 'mobx';

export interface OnResponseCallback {
  (args: OnResponseCallbackArgs): Promise<void>;
}

export interface TransformErrorFn {
  (error: any): any; // TODO: add better typings for this
}
export interface MobxRequestorArgs<T> {
  call(...args: any[]): Promise<T>;
  onResponse?: OnResponseCallback;
  autoClear?: boolean;
  defaultResponse?: any;
  transformError?: TransformErrorFn;
}

export interface CallbackFn {
  (): void;
}

export type MobxRequestorState = 'initial' | 'fetching' | 'success' | 'error';

export interface UploadDownloadProgressArgs {
  percentage: number;
}

export interface OnResponseCallbackArgs {
  prevResponse: any;
  response: any;
  state: MobxRequestorState;
  fetchId: string;
  params: any;
  error: any;
}

export class MobxRequestor<T> {
  fetchId: string = '';

  requestPromise?: Promise<T>;

  transformError?: TransformErrorFn;

  onResponse?: OnResponseCallback;

  call;

  lastSentPayload: any;

  onAbort?: CallbackFn;

  state: MobxRequestorState = 'initial';

  storedResponse?: T;

  defaultResponse?: any;

  _rawError: any;

  requestCount = 0;

  autoClear?: boolean = true;

  downloadProgress = 0;

  uploadProgress = 0;

  resetUploadProgress() {
    this.uploadProgress = 0;
  }

  resetDownloadProgress() {
    this.downloadProgress = 0;
  }

  resetProgressReport() {
    this.resetUploadProgress();
    this.resetDownloadProgress();
  }

  get uploadComplete() {
    return this.uploadProgress === 100;
  }

  get downloadComplete() {
    return this.downloadProgress === 100;
  }

  reportUploadProgress = (args: UploadDownloadProgressArgs) => {
    this.uploadProgress = args.percentage;
  };

  reportDownloadProgress = (args: UploadDownloadProgressArgs) => {
    this.downloadProgress = args.percentage;
  };

  get loading() {
    return this.state === 'fetching';
  }

  get success() {
    return this.state === 'success';
  }

  get initialOrLoading() {
    const { state, loading } = this;
    return state === 'initial' || loading;
  }

  setResponse = (response: T) => {
    this._setResult(response, 'success', null);
  };

  clearResponse = () => {
    this._setResult(undefined, 'initial', null);
  };

  clearErrorAndResponse = () => {
    this.clearError();
    this.clearResponse();
  };

  async setResult(args: any) {
    const { fetchId } = args;
    // ignore request that is not current
    if (this.fetchId !== fetchId) return;

    const executeOnResponse = action(async (providedArgs: any) => {
      try {
        await this.onResponse?.(providedArgs);
      } catch (execError) {
        console.error('executeResponse error: ', execError);
      }
    });

    const providedArgs = { ...args, prevResponse: this.storedResponse };

    if (this.onResponse) {
      await executeOnResponse(providedArgs);
    }

    const { response, state, error } = providedArgs;

    this._setResult(response, state, error);
  }

  _setResult = (response: T | undefined, state: MobxRequestorState, error: any) => {
    this.storedResponse = response;
    this.state = state;
    this.requestPromise = undefined;

    if (error) {
      this._rawError = error;
    }
  };

  get error() {
    const receivedError = this._rawError || {};
    const { sender } = receivedError;

    const error = this.transformError
      ? this.transformError(receivedError) ?? 'UKNONW_ERROR'
      : sender?.response?.token || sender?.statusText || receivedError?.type || receivedError?.message;

    return error;
  }

  get rawError() {
    return this._rawError;
  }

  get response() {
    return this.storedResponse || this.defaultResponse;
  }

  /**
   * stores the last payload sent to this request. It stores all the arguments passed to execCall
   */
  get lastPayloadSent() {
    return this.lastSentPayload;
  }

  abort() {
    const { requestPromise, onAbort } = this;
    // TODO: should be abortable promise
    if ((requestPromise as any)?.abort) {
      (requestPromise as any).abort();

      onAbort?.();
    }
  }

  clearError() {
    this._rawError = null;
  }

  async _handleError(responseError: any, fetchId: string, params: any) {
    const { sender } = responseError;
    if (sender?.status === 0) {
      // ignore abort errors
      this._setResult(undefined, 'error', undefined);
      return;
    }

    console.error('error requesting data for', this.fetchId, params, responseError);

    await this.setResult({
      response: null,
      state: 'error',
      fetchId,
      params,
      error: responseError,
    });
  }

  async execCall(...args: any[]) {
    this.requestCount++;

    this.fetchId = `${this.requestCount}`;

    const { fetchId } = this;

    try {
      this.state = 'fetching';
      this._rawError = null;

      if (this.autoClear) {
        this.storedResponse = {} as T;
      }

      this.abort();

      const { call: theActualPromisedFunction } = this;

      if (!theActualPromisedFunction) {
        throw new Error('"call" method not set');
      }

      if (typeof theActualPromisedFunction !== 'function') {
        throw new Error(`"call" is expected to be a function. Received ${theActualPromisedFunction}`);
      }

      const p = theActualPromisedFunction(...args);

      this.resetProgressReport();

      if (!p) throw new Error(`no promise returned when calling ${theActualPromisedFunction}`);

      (p as any).onUploadProgress = this.reportUploadProgress;
      (p as any).onDownloadProgress = this.reportDownloadProgress;

      this.requestPromise = p;

      this.lastSentPayload = args;

      const response = await p;

      await this.setResult({
        response,
        state: 'success',
        fetchId,
        params: args,
      });
    } catch (error) {
      await this._handleError(error, fetchId, args);
    }
  }

  constructor(opts: MobxRequestorArgs<T>) {
    makeObservable(this, {
      state: observable,
      storedResponse: observable.shallow,
      _rawError: observable.shallow,
      rawError: computed,
      error: computed,
      downloadProgress: observable,
      uploadProgress: observable,
      resetUploadProgress: action,
      resetDownloadProgress: action,
      resetProgressReport: action,
      uploadComplete: computed,
      downloadComplete: computed,
      reportUploadProgress: action,
      reportDownloadProgress: action,
      loading: computed,
      success: computed,
      initialOrLoading: computed,
      setResponse: action,
      clearResponse: action,
      clearErrorAndResponse: action,
      setResult: action,
      _setResult: action,
      response: computed,
      lastPayloadSent: computed,
      clearError: action,
      _handleError: action,
      execCall: action,
    });

    const { call, onResponse, autoClear, defaultResponse, transformError } = opts;
    if (!call) {
      throw new Error('"call" parameter should be defined');
    }

    this.call = call;
    this.transformError = transformError;
    this.onResponse = onResponse;
    this.autoClear = autoClear;
    this.defaultResponse = defaultResponse;
  }
}
