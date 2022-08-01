import { ActionType, CHAIN_ID, MEMO_TYPE } from "./constant/type";
import { IMultiSignOptions, IPaymentTopic } from "./types";
import { IToken } from "./types/common";
import { isPositiveInteger, isPositiveStr } from "./util";
import wallet from "./util/wallet";
import { isValidCurrency } from "@swtc/common";
import { IAmount } from "@swtc/wallet";
import BigNumber from "bignumber.js";

export default class MultiSignTransaction {
  private currency: string;
  private issuer: string;
  private value: string;
  private chainId = CHAIN_ID.SWTC;

  constructor(options: IMultiSignOptions) {
    const { currency, issuer, value } = options;
    this.currency = currency;
    this.issuer = issuer;
    this.value = value;
  }

  public isNativeToken(token: IToken): boolean {
    return (
      (token?.currency?.toUpperCase() === "SWT" || token?.currency?.toUpperCase() === "SWTC") && token?.issuer === ""
    );
  }

  public isNonNativeToken(token: IToken): boolean {
    return isValidCurrency(token?.currency) && wallet.isValidAddress(token?.issuer);
  }

  public isAmount(amount: IAmount): boolean {
    return new BigNumber(amount.value).isPositive() && (this.isNativeToken(amount) || this.isNonNativeToken(amount));
  }

  /**
   * 是否是多签注册登记
   *
   * @param {*} data
   * @returns {boolean}
   * @memberof MultiSignTransaction
   */
  public isRegisterAction(data): boolean {
    const { type, action, account, category } = data || {};
    return (
      type === MEMO_TYPE.NAME_SERVICE &&
      action === ActionType.REGISTER &&
      wallet.isValidAddress(account) &&
      category === ActionType.MULTI_SIGN
    );
  }

  /**
   * 是否是多签注销登记
   *
   * @param {*} data
   * @returns {boolean}
   * @memberof MultiSignTransaction
   */
  public isUnregisterAction(data): boolean {
    const { type, action, account, category } = data || {};
    return (
      type === MEMO_TYPE.NAME_SERVICE &&
      action === ActionType.UNREGISTER &&
      wallet.isValidAddress(account) &&
      category === ActionType.MULTI_SIGN
    );
  }

  /**
   * 是否是转账topic
   *
   * @param {*} data
   * @returns {boolean}
   * @memberof MultiSignTransaction
   */
  public isPaymentTopic(data: IPaymentTopic): boolean {
    const { type, template, topic } = data || {};
    const { name, description, deadline, operation } = topic || {};
    const { chainId, from, to, seq, token } = operation || {};
    return (
      type === MEMO_TYPE.MULTI_SIGN &&
      isPositiveStr(template) &&
      data.chainId === this.chainId &&
      isPositiveStr(name) &&
      isPositiveStr(description) &&
      isPositiveInteger(deadline) &&
      chainId === this.chainId &&
      wallet.isValidAddress(from) &&
      wallet.isValidAddress(to) &&
      isPositiveInteger(seq) &&
      this.isAmount(token)
    );
  }

  public multiSign(tx, secret: string) {
    return wallet.multiSign(tx, secret);
  }
}
