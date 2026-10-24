import {
  buildPublicHealthStatisticsProjection,
  type PublicHealthStatisticsProjection,
} from 'fhir-data-utils-ts/public-health-statistics';

export const PublicHealthStatisticsContributionPaths = Object.freeze({
  ClinicalCertification: 'clinical-certification',
  IndividualClinicalRecord: 'individual-clinical-record',
  IndividualSelfReport: 'individual-self-report',
} as const);
export type PublicHealthStatisticsContributionPath =
  typeof PublicHealthStatisticsContributionPaths[keyof typeof PublicHealthStatisticsContributionPaths];

export const PublicHealthStatisticsCollectionPurposes = Object.freeze({
  ClinicalStatistics: 'public-clinical-statistics',
  UserReports: 'public-health-user-reports',
} as const);
export type PublicHealthStatisticsCollectionPurpose =
  typeof PublicHealthStatisticsCollectionPurposes[keyof typeof PublicHealthStatisticsCollectionPurposes];

export type PublicHealthStatisticsContribution = Readonly<{
  path: PublicHealthStatisticsContributionPath;
  collectionPurpose: PublicHealthStatisticsCollectionPurpose;
  projection: PublicHealthStatisticsProjection;
}>;

/**
 * Applies trusted contribution policy before producing public statistical
 * metadata. The professional path is evaluated during clinical certification;
 * one individual path accepts an already-final, verified clinic-originated
 * record; the other accepts a coded self-report. Both individual paths route
 * to a separate user-report purpose without creating a Digital Twin.
 *
 * The caller must derive `authority` from its reopened server profile and
 * authoritative clinical readback. Browser input never establishes creator
 * qualification, clinic origin or individual authority.
 */
export function preparePublicHealthStatisticsContribution(input: Readonly<{
  path: PublicHealthStatisticsContributionPath;
  evidence: unknown;
  authority: Readonly<Record<string, unknown>>;
}>): PublicHealthStatisticsContribution {
  const authority = input.authority || {};
  let collectionPurpose: PublicHealthStatisticsCollectionPurpose;

  if (input.path === PublicHealthStatisticsContributionPaths.ClinicalCertification) {
    if (authority.qualifiedCreator !== true) {
      throw new TypeError('public_health_statistics_qualified_creator_required');
    }
    if (authority.attachmentPresent !== true) {
      throw new TypeError('public_health_statistics_clinical_attachment_required');
    }
    if (authority.reviewAttested !== true) {
      throw new TypeError('public_health_statistics_review_attestation_required');
    }
    collectionPurpose = PublicHealthStatisticsCollectionPurposes.ClinicalStatistics;
  } else if (input.path === PublicHealthStatisticsContributionPaths.IndividualClinicalRecord) {
    if (authority.individualAuthorized !== true) {
      throw new TypeError('public_health_statistics_individual_authorization_required');
    }
    if (authority.selfCreated === true) {
      throw new TypeError('public_health_statistics_self_created_clinical_evidence_forbidden');
    }
    if (authority.clinicOriginVerified !== true) {
      throw new TypeError('public_health_statistics_clinic_origin_required');
    }
    collectionPurpose = PublicHealthStatisticsCollectionPurposes.UserReports;
  } else if (input.path === PublicHealthStatisticsContributionPaths.IndividualSelfReport) {
    if (authority.individualAuthorized !== true) {
      throw new TypeError('public_health_statistics_individual_authorization_required');
    }
    collectionPurpose = PublicHealthStatisticsCollectionPurposes.UserReports;
  } else {
    throw new TypeError('public_health_statistics_contribution_path_invalid');
  }

  return Object.freeze({
    path: input.path,
    collectionPurpose,
    projection: buildPublicHealthStatisticsProjection(input.evidence),
  });
}
