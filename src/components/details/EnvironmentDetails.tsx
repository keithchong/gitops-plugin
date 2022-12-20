import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';

import { Timestamp, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { getReferenceForModel } from '@openshift-console/dynamic-plugin-sdk/lib/utils/k8s/k8s-ref';
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  Label,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Tooltip,
} from '@patternfly/react-core';
import { GitAltIcon } from '@patternfly/react-icons';

import * as argoIcon from '../../images/argo.png';
import { ConsoleLinkModel } from '../models';
import ExternalLink from '../utils/ExternalLink/ExternalLink';
import { GitOpsEnvironment } from '../utils/gitops-types';
import { K8sResourceKind } from '../utils/types';

import RenderStatusLabel from './RenderStatusLabel';
import GitOpsResourcesSection from './ResourcesSection';

import './EnvironmentDetails.scss';

interface GitOpsDetailsProps {
  envs: GitOpsEnvironment[];
  appName: string;
  manifestURL: string;
  error: Error;
}

const EnvironmentDetails: React.FC<GitOpsDetailsProps> = ({
  envs,
  appName,
  manifestURL,
  error,
}) => {
  const { t } = useTranslation();
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: getReferenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const argocdLink = _.find(
    consoleLinks,
    (link: K8sResourceKind) =>
      link.metadata?.name === 'argocd' && link.spec?.location === 'ApplicationMenu',
  );

  let oldAPI = false;
  if (envs && envs.length > 0) {
    oldAPI = envs[0] && envs[0].deployments ? envs[0].deployments === null : true;
  }
  let errMsg = '';
  if (error != null) {
    errMsg = t('gitops-plugin~Error cannot retrieve environments');
  }

  return (
    <div className="gitops-plugin__environment-details">
      {oldAPI && (
        <Alert
          isInline
          title={t('gitops-plugin~Compatibility Issue')}
          className="gitops-plugin__environment-details__special-message-alert"
        >
          {t('gitops-plugin~Compatibility Issue Message')}
        </Alert>
      )}
      {error != null && (
        <Alert
          isInline
          title={t('gitops-plugin~Error Encountered')}
          className="gitops-plugin__environment-details__special-message-alert"
        >
          {errMsg}
        </Alert>
      )}
      {_.map(
        envs,
        (env) =>
          env && (
            <Stack
              className="gitops-plugin__environment-details__env-section"
              key={env.environment}
            >
              <StackItem>
                <Card>
                  <CardTitle className="gitops-plugin__environment-details__env-section__header">
                    <Stack>
                      <StackItem>
                        <h2 className="co-section-heading co-truncate co-nowrap gitops-plugin__environment-details__env-section__app-name">
                          <Tooltip content={env.environment}>
                            <span>{env.environment}</span>
                          </Tooltip>
                        </h2>
                      </StackItem>
                      <StackItem className="co-truncate co-nowrap">
                        {env.cluster ? (
                          <ExternalLink
                            additionalClassName="gitops-plugin__environment-details__env-section__cluster-url"
                            href={env.cluster}
                          >
                            {env.cluster}
                          </ExternalLink>
                        ) : (
                          <div className="gitops-plugin__environment-details__env-section__cluster-url-empty-state">
                            {t('gitops-plugin~Cluster URL not available')}
                          </div>
                        )}
                      </StackItem>
                      {env.status && (
                        <StackItem className="gitops-plugin__environment-details__env-section__status-label">
                          <Tooltip content="Sync status">
                            <RenderStatusLabel status={env.status} />
                          </Tooltip>
                        </StackItem>
                      )}
                    </Stack>
                  </CardTitle>
                  <CardBody>
                    <Stack className="gitops-plugin__environment-details__revision">
                      {env.revision ? (
                        <>
                          {env.revision.message ? (
                            <StackItem className="gitops-plugin__environment-details__message">
                              {t('gitops-plugin~{{message}}', { message: env.revision.message })}
                            </StackItem>
                          ) : (
                            <StackItem className="gitops-plugin__environment-details__warning-message">
                              <span>{t('gitops-plugin~Commit message not available')}</span>
                            </StackItem>
                          )}
                          <StackItem className="gitops-plugin__environment-details__author-sha">
                            {env.revision.author ? (
                              <span className="gitops-plugin__environment-details__author">
                                {t('gitops-plugin~by {{author}}', { author: env.revision.author })}{' '}
                              </span>
                            ) : (
                                <span className="gitops-plugin__environment-details__author-unavailable">
                                  {t('gitops-plugin~Commit author not available')}{' '}
                                </span>
                            )}
                            {env.revision.revision ? (
                              <Label
                                className="gitops-plugin__environment-details__sha"
                                color="blue"
                                icon={<GitAltIcon />}
                                variant="outline"
                              >
                                {env.revision.revision.substring(0, 7)}
                              </Label>
                            ) : (
                              <Label
                                className="gitops-plugin__environment-details__sha"
                                color="blue"
                                icon={<GitAltIcon />}
                                variant="outline"
                              >
                                N/A
                              </Label>
                            )}
                          </StackItem>
                        </>
                      ) : (
                        <span>{t('gitops-plugin~Commit details not available')}</span>
                      )}
                      {env.lastDeployed ? (
                        <StackItem className="co-truncate co-nowrap gitops-plugin__environment-details__env-section__time">
                          {t('gitops-plugin~Last deployed')}&nbsp;
                          <Timestamp timestamp={env.lastDeployed} />
                        </StackItem>
                      ) : (
                        <StackItem className="co-truncate co-nowrap gitops-plugin__environment-details__env-section__time-unavailable">
                          <span>{t('gitops-plugin~Last deployed time not available')}</span>
                        </StackItem> 
                      )}
                      <StackItem>
                        <Split className="gitops-plugin__environment-details__env-section__deployment-history">
                          <SplitItem className="gitops-plugin__environment-details__env-section__deployment-history__deploymentHistoryPageLink">
                            <Link
                              to={`/envdynamic/${appName}/deploymenthistory?url=${manifestURL}&rowFilter-environment=${env.environment}`}
                              title={t('gitops-plugin~Deployment history')}
                            >
                              {t<string>('gitops-plugin~Deployment history')}
                            </Link>
                          </SplitItem>
                          {argocdLink && (
                            <Tooltip content="Argo CD">
                              <SplitItem className="gitops-plugin__environment-details__env-section__deployment-history__argocd-link">
                                <ExternalLink
                                  href={`${argocdLink.spec.href}/applications/${env.environment}-${appName}`}
                                >
                                  <span className="gitops-plugin__environment-details__env-section__argo-external-link">
                                    <img
                                      loading="lazy"
                                      src={argoIcon}
                                      alt="Argo CD"
                                      width="19px"
                                      height="24px"
                                    />
                                  </span>
                                </ExternalLink>
                              </SplitItem>
                            </Tooltip>
                          )}
                        </Split>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              </StackItem>
              <GitOpsResourcesSection
                services={env.services}
                secrets={env.secrets}
                deployments={env.deployments}
                routes={env.routes}
                roleBindings={env.roleBindings}
                clusterRoles={env.clusterRoles}
                clusterRoleBindings={env.clusterRoleBindings}
              />
            </Stack>
          ),
      )}
    </div>
  );
};

export default EnvironmentDetails;
