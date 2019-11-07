import { Injectable } from '@angular/core';
import * as crypto from 'crypto-js';
import { LogHelper } from 'app/helpers/log-helper';

@Injectable()
export class SignatureInternalService {
    constructor(
        private  _logHelper: LogHelper
    ) {}

    public Sign(input: any, key: string, hashKey: boolean): string {
        // firmo
        let _key: string;
        if (hashKey) {
            _key = this._hashMD5(key);
        }else {
            _key = key;
        }
        _key = _key.toUpperCase();
        const _List2Sign: string[] = [];
        const inputString = this._serialize(input);
        _List2Sign.push(inputString);
        _List2Sign.push(_key);
        return this._hashSHA256(this._serialize(_List2Sign));
    }

    public DisassembleToken(token: string): Array<string> {

        try {
            const spliter = new Buffer(token.substr(0, 2), 'hex').toString('latin1');

            const signatureKey = token.substr(2, 64);

            const encodeparameters = token.substr(66);

            const clearstring = this._decryptAES(encodeparameters, signatureKey, true);

            const newDecryptedHash = this._hashSHA256(clearstring);

            if (signatureKey == newDecryptedHash) {

                const result = clearstring.split(spliter);

                const secretKey = result[result.length - 1].toString();
                this._logHelper.trace(secretKey);
                const response: Array<string> = new Array();

                result.forEach((s: string) => {
                    response.push(s);
                });
                return response;

            }
            return new Array<string>();
        } catch (ex) {
            throw ex;
        }

    }


    public Validate(source: any, sign: string, key: string, hashKey: boolean): boolean {
        let originalSign: string;
        try {
            originalSign = this.Sign(source, key, true);
            if (originalSign === sign) {
                return true;
            }else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    private _decryptAES(hash: string, key: string, hashKey: boolean): string {

        if (hash == undefined || key == undefined) {
            return undefined;
        }
        if (hashKey) {
            key = this._hashMD5(key);
        }
        const data = new Buffer(hash, 'hex').toString('base64');


        // Decrypt...
        const plaintextArray = crypto.AES.decrypt(
        data,
        crypto.enc.Hex.parse(key),
        { iv: crypto.enc.Hex.parse('0000000000000000'),
            mode: crypto.mode.CBC
        }
        );
       return crypto.enc.Latin1.stringify(plaintextArray);

    }

    private _serialize(input: any): string {
        // serializo
        const output = JSON.stringify(input).toString();
        return output;
    }

    private _hashSHA256(phase: string): string {
        // creo el hash
        if (phase == undefined) {
            return undefined;
        }
        return crypto.SHA256(phase).toString().toUpperCase();
    }

    private _hashMD5(phase: string): string {
        // creo el hash
        if (phase == undefined) {
            return undefined;
        }
        return crypto.MD5(phase).toString().toLocaleUpperCase();
    }
}
