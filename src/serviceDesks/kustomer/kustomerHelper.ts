/**
 * (C) Copyright Kustomer 2021.
 *
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 */
import { onConversationEndedResponse, onConversationCreateResponse, sendMessageResponse, describeCustomerResponse, describeConversationResponse, initKustomerCoreResponse, loginResponse } from './kustomerTypes';

export function isChatAvailable(): Promise<object> {
    return new Promise((resolve, reject) => {
        try {
            const result = KustomerCore.isChatAvailable();
            resolve(result);
        } catch (error) {
            reject(error);
        }
    });
}

export function createConversation(title: string, brandID: string): Promise<onConversationCreateResponse> {
    return new Promise((resolve, reject) => {
        try {
            KustomerCore.createConversation({
                title: title,
                brand: brandID
            }, function (response: onConversationCreateResponse) {
                resolve(response)
            });
        } catch (error) {
            reject(error);
        }
    });
}

export function describeCustomer(emails: Array<string>, phones: Array<string>, socials: Array<object>, customAttributes: object): Promise<describeCustomerResponse> {
    return new Promise((resolve, reject) => {
        try {
            let attributes: any = {}
            if (emails && emails.length > 0) attributes.emails = emails;
            if (phones && phones.length > 0) attributes.phones = phones;
            if (socials && socials.length > 0) attributes.socials = socials;
            KustomerCore.describeCustomer({
                attributes: attributes,
                customAttributes: customAttributes
            }, (response: describeCustomerResponse) => {
                resolve(response)
            })
        } catch (error) {
            reject(error);
        }
    });
};

export function login(jwtToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            KustomerCore.login({
                jwtToken: jwtToken
            }, (response: loginResponse) => {
                resolve(response)
            })
        } catch (error) {
            reject(error);
        }
    });
}

export function logout(): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            KustomerCore.logout((response: any) => {
                resolve(response);
            });
        }
        catch (error) {
            reject(error);
        }
    })
}

export function sendMessage(messageObj: any): Promise<sendMessageResponse> {
    return new Promise((resolve, reject) => {
        try {
            KustomerCore.sendMessage(messageObj, (respsone: sendMessageResponse) => {
                resolve(respsone);
            });
        } catch (error) {
            reject(error);
        }
    })
}

export function initKustomerCore(brandId: string): Promise<initKustomerCoreResponse> {
    return new Promise((resolve, reject) => {
        try {
            KustomerCore.init({
                brandId: brandId
            }, (chatSetting: initKustomerCoreResponse) => {
                resolve(chatSetting);
            });
        } catch (error) {
            reject(error);
        }
    });
}

export function describeConversation(sessionId: string, customAttributes: object): Promise<describeConversationResponse> {
    return new Promise((resolve, reject) => {
        try {
            KustomerCore.describeConversation({
                conversationId: sessionId,
                customAttributes: customAttributes
            }, (response: describeConversationResponse) => {
                resolve(response)
            });
        } catch (error) {
            reject(error);
        }
    });
}

export function endConversation(sessionId: string): Promise<onConversationEndedResponse> {
    return new Promise((resolve, reject) => {
        try {
            KustomerCore.endConversation({
                conversationId: sessionId
            }, function (response: onConversationEndedResponse, error: any) {
                resolve(response);
            });
        } catch (error) {
            reject(error);
        }
    });
}

export function markRead(sessionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            KustomerCore.markRead({
                conversationId: sessionId
            }, (response: any) => {
                resolve(response)
            });
        } catch (error) {
            reject(error);
        }
    });
}

export function sendTypingActivity(sessionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            KustomerCore.sendTypingActivity({
                conversationId: sessionId,
                typing: true,
            }, (response: any) => {
                resolve(response)
            });
        } catch (error) {
            reject(error);
        }
    });
}
