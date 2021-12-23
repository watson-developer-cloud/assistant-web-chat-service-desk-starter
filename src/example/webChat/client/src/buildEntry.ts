/**
 * (C) Copyright IBM Corp. 2020.
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
import { ServiceDesk, ServiceDeskFactoryParameters } from '../../../../common/types/serviceDesk';
import { ExampleServiceDesk } from './exampleServiceDesk';
// Change ServiceDeskTemplate to your service desk implementation
import { ServiceDeskTemplate } from './serviceDeskTemplate';

/**
 * This file exports the methods used by web chat to communicate back and forth with the service desk. It is exposed
 * as window.WebChatServiceDeskFactory and should be passed into your web chat config as shown in the README.md.
 */

/**
 * A factory to generate a new set of service desk extensions.
 *
 * @param parameters ServiceDeskFactoryParameters passed from web chat into service desk.
 */
function WebChatServiceDeskFactory(parameters: ServiceDeskFactoryParameters): ServiceDesk {
  return getInstance(parameters);
}

function getInstance(
  parameters: ServiceDeskFactoryParameters,
  // Change ServiceDeskTemplate to your service desk implementation
): ExampleServiceDesk | ServiceDeskTemplate {
  // Change ServiceDeskTemplate to your service desk implementation
  const serviceDeskClass: string = 'ExampleServiceDesk';
  const constructors: any = {
    ExampleServiceDesk,

    // Change ServiceDeskTemplate to your service desk implementation
    ServiceDeskTemplate,
  };
  return new constructors[serviceDeskClass](parameters);
}

export default WebChatServiceDeskFactory;
