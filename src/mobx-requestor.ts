import { action, computed, makeObservable, observable } from 'mobx';

export type MobxRequestorState = 'initial' | 'fetching' | 'success' | 'error';
export interface PromisedFn<T> {
  (...args: any[]): Promise<T>;
}
export interface TransformErrorFn<K> {
  (error: K): string;
}
export interface MobxRequestorArgs<T, F extends PromisedFn<T>, K extends Error> {
  call: F;
  autoClear?: boolean;
  defaultResponse?: Partial<T>;
  transformError?: TransformErrorFn<K>;
}

export interface UploadDownloadProgressArgs {
  percentage: number;
}

export interface SetResultParams<T, K extends Error, F extends PromisedFn<T>> {
  response: T | null;
  state: MobxRequestorState;
  fetchId: string;
  params: Parameters<F>;
  error?: K | null;
}

export class MobxRequestor<T = any, F extends PromisedFn<T> = PromisedFn<any>, K extends Error = Error> {
  _fetchId: string = '';

  _requestPromise: Promise<T> | null = null;

  _transformError?: TransformErrorFn<K>;

  _call: PromisedFn<T>;

  _state: MobxRequestorState = 'initial';

  _storedResponse: T | null = null;

  _defaultResponse: T | Partial<T> | null;

  _rawError: K | null;

  _requestCount = 0;

  _autoClear?: boolean = true;

  _downloadProgress: number = 0;

  _uploadProgress: number = 0;

  resetUploadProgress() {
    this._uploadProgress = 0;
  }

  resetDownloadProgress() {
    this._downloadProgress = 0;
  }

  resetProgressReport() {
    this.resetUploadProgress();
    this.resetDownloadProgress();
  }

  get uploadComplete() {
    return this._uploadProgress === 100;
  }

  get downloadComplete() {
    return this._downloadProgress === 100;
  }

  reportUploadProgress = (args: UploadDownloadProgressArgs) => {
    this._uploadProgress = args.percentage;
  };

  reportDownloadProgress = (args: UploadDownloadProgressArgs) => {
    this._downloadProgress = args.percentage;
  };

  get loading(): boolean {
    return this._state === 'fetching';
  }

  get success(): boolean {
    return this._state === 'success';
  }

  get initialOrLoading(): boolean {
    const { _state: state, loading } = this;
    return state === 'initial' || loading;
  }

  setResponse = (response: T) => {
    this._setResult(response, 'success', null);
  };

  clearResponse = () => {
    this._setResult(null, 'initial', null);
  };

  clearErrorAndResponse = () => {
    this.clearError();
    this.clearResponse();
  };

  async setResult(args: SetResultParams<T, K, F>) {
    const { fetchId } = args;
    // ignore request that is not current
    if (this._fetchId !== fetchId) return;

    const { response, state, error } = args;

    this._setResult(response, state, error);
  }

  _setResult = (response: T | null, state: MobxRequestorState, error: K | null | undefined) => {
    this._storedResponse = response;
    this._state = state;
    this._requestPromise = null;

    if (error) {
      this._rawError = error;
    }
  };

  get error(): string {
    const receivedError = this._rawError;

    if (!receivedError) return '';

    const error = (this._transformError && this._transformError(receivedError)) || (receivedError as any)?.type || receivedError?.message || 'UNKNONW_ERROR';

    return error;
  }

  get rawError() {
    return this._rawError;
  }

  get response() {
    return this._storedResponse || this._defaultResponse;
  }

  clearError() {
    this._rawError = null;
  }

  async _handleError(error: K, fetchId: string, params: Parameters<F>) {
    console.error('error requesting data for', this._fetchId, params, error);

    await this.setResult({
      response: null,
      state: 'error',
      fetchId,
      params,
      error,
    });
  }

  async execCall(...args: Parameters<F>) {
    this._requestCount++;

    this._fetchId = `${this._requestCount}`;

    const { _fetchId: fetchId } = this;

    try {
      this._state = 'fetching';
      this._rawError = null;

      if (this._autoClear) {
        this._storedResponse = {} as T;
      }

      const { _call: theActualPromisedFunction } = this;

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

      this._requestPromise = p;

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

  constructor(opts: MobxRequestorArgs<T, F, K>) {
    makeObservable(this, {
      _state: observable,
      _storedResponse: observable.ref,
      _rawError: observable.ref,
      rawError: computed,
      error: computed,
      _downloadProgress: observable,
      _uploadProgress: observable,
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
      clearError: action,
      _handleError: action,
      execCall: action,
    });

    const { call, autoClear = true, defaultResponse, transformError } = opts;

    if (!call) {
      throw new Error('"call" parameter not provided');
    }

    this._call = call;

    this._transformError = transformError;
    this._autoClear = autoClear;
    this._defaultResponse = defaultResponse || null;
    this._storedResponse = null;
    this._rawError = null;
  }
}
