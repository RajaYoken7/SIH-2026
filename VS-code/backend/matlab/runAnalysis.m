% =============================================================
%  runAnalysis.m  — MATLAB CLI Entry Point
%
%  Called by Node.js backend via:
%    matlab -batch "runAnalysis('inputImagePath', 'outputJsonPath', 'outputImgPath')"
%
%  This file is the ONLY new MATLAB code.  It only orchestrates
%  the existing project functions — zero algorithm changes.
%
%  All source of truth remains in:
%    src/metrics/        calculateBlurScore, calculateEdgeDensity,
%                        calculateIlluminationMetrics, createFundusRegionMask
%    src/quality/        calculateQualityMetrics, classifyImageQuality
%    src/preprocessing/  preprocessFundusImage
%    src/scoring/        calculateQualityScores, fuseQualityScores,
%                        normalizeQualityMetric
%    config/             qualityThresholds
% =============================================================
function runAnalysis(inputImagePath, outputJsonPath, outputImgPath)
%RUNANALYSIS Entry point called by the Node.js backend via MATLAB -batch.
%   RUNANALYSIS(INPUTIMAGEPATH, OUTPUTJSONPATH, OUTPUTIMGPATH) runs the
%   complete Phase-2D quality pipeline on INPUTIMAGEPATH, writes the
%   results as a JSON file to OUTPUTJSONPATH, and saves the CLAHE-enhanced
%   image to OUTPUTIMGPATH.  Exit code 0 = success, 1 = failure.

% ------------------------------------------------------------------
% 0. Locate MATLAB project root so addpath works
% ------------------------------------------------------------------
projectRoot = '';
matlabSrcEnv = getenv('MATLAB_SRC_PATH');
if ~isempty(matlabSrcEnv) && isfolder(matlabSrcEnv)
    projectRoot = matlabSrcEnv;
else
    % Look for Mat-Lab/DR-project relative to workspace
    thisFile = mfilename('fullpath');
    backendDir = fileparts(fileparts(thisFile));
    workspaceRoot = fileparts(fileparts(backendDir));
    candidate = fullfile(workspaceRoot, 'Mat-Lab', 'DR-project');
    if isfolder(candidate)
        projectRoot = candidate;
    else
        % Fallback candidate
        candidate2 = 'C:\Me\coding\SIH-2026\Mat-Lab\DR-project';
        if isfolder(candidate2)
            projectRoot = candidate2;
        end
    end
end

if ~isempty(projectRoot) && isfolder(projectRoot)
    addpath(genpath(fullfile(projectRoot, 'src')));
    addpath(fullfile(projectRoot, 'config'));
end

% ------------------------------------------------------------------
% 1. Validate arguments
% ------------------------------------------------------------------
if nargin < 3
    error('runAnalysis:MissingArgs', ...
        'Usage: runAnalysis(inputImagePath, outputJsonPath, outputImgPath)');
end
inputImagePath = char(inputImagePath);
outputJsonPath = char(outputJsonPath);
outputImgPath  = char(outputImgPath);

if ~isfile(inputImagePath)
    writeError(outputJsonPath, 'IMAGE_NOT_FOUND', ...
        sprintf('Image file not found: %s', inputImagePath));
    exit(1);
end

% ------------------------------------------------------------------
% 2. Run the pipeline (mirrors run_phase2d_quality_fusion.m exactly)
% ------------------------------------------------------------------
try
    % --- Preprocessing (resize 512x512, grayscale, CLAHE) -----------
    processed = preprocessFundusImage(inputImagePath);

    % --- Core quality metrics ----------------------------------------
    qualityMetrics = calculateQualityMetrics(processed.Gray);

    % --- Illumination metrics ----------------------------------------
    illuminationMetrics = calculateIlluminationMetrics(processed.Gray);

    % --- Edge-density metrics ----------------------------------------
    edgeMetrics = calculateEdgeDensity(processed.Gray);

    % --- Merge metrics into one struct (Phase 2D pattern) ------------
    qualityMetrics.MeanBrightness        = illuminationMetrics.MeanBrightness;
    qualityMetrics.BrightnessStd         = illuminationMetrics.BrightnessStd;
    qualityMetrics.CoefficientOfVariation = illuminationMetrics.CoefficientOfVariation;
    qualityMetrics.IlluminationUniformity = illuminationMetrics.IlluminationUniformity;
    qualityMetrics.ValidPixelFraction    = illuminationMetrics.ValidPixelFraction;
    qualityMetrics.MaskThreshold         = illuminationMetrics.MaskThreshold;
    qualityMetrics.EdgeDensity           = edgeMetrics.EdgeDensity;
    qualityMetrics.EdgePixelCount        = edgeMetrics.EdgePixelCount;

    % --- Component scores 0-100 -------------------------------------
    weights = struct('BrightnessIllumination', 0.30, 'Contrast', 0.20, ...
        'BlurDetail', 0.25, 'EdgeDetail', 0.25);
    scores = calculateQualityScores(qualityMetrics);
    fused  = fuseQualityScores(scores, weights);

    % --- Phase 1 classification (GOOD / DARK / BLURRY) --------------
    thresholds = qualityThresholds();
    classification = classifyImageQuality(qualityMetrics, thresholds);

    % --- Map classification label to overall status -----------------
    switch classification.Label
        case 'GOOD'
            overallStatus  = 'ACCEPTABLE';
            recommendation = 'Image is suitable for retinal analysis. Proceed to DR screening.';
        case 'DARK'
            overallStatus  = 'INADEQUATE';
            recommendation = 'Image is too dark. Please recapture the fundus image.';
        case 'BLURRY'
            overallStatus  = 'BORDERLINE';
            recommendation = 'Image contrast is low. Adaptive CLAHE enhancement has been applied.';
        otherwise
            overallStatus  = 'UNKNOWN';
            recommendation = 'Quality could not be determined. Please review manually.';
    end

catch pipelineErr
    writeError(outputJsonPath, 'PIPELINE_ERROR', pipelineErr.message);
    exit(1);
end

% ------------------------------------------------------------------
% 3. Save CLAHE-enhanced image
% ------------------------------------------------------------------
try
    imwrite(processed.Enhanced, outputImgPath);
catch imgErr
    writeError(outputJsonPath, 'IMAGE_WRITE_ERROR', imgErr.message);
    exit(1);
end

% ------------------------------------------------------------------
% 4. Build result struct and write JSON
% ------------------------------------------------------------------
result = struct();

% Image info
result.image = struct();
result.image.width  = size(processed.Gray, 2);
result.image.height = size(processed.Gray, 1);

% Raw metrics  (all values exactly as MATLAB computed them)
result.rawMetrics = struct();
result.rawMetrics.brightness             = qualityMetrics.Brightness;
result.rawMetrics.contrast               = qualityMetrics.Contrast;
result.rawMetrics.foregroundBrightness   = qualityMetrics.ForegroundBrightness;
result.rawMetrics.sharpness              = qualityMetrics.Sharpness;
result.rawMetrics.blurScore              = qualityMetrics.BlurScore;
result.rawMetrics.meanBrightness         = qualityMetrics.MeanBrightness;
result.rawMetrics.brightnessStd          = qualityMetrics.BrightnessStd;
result.rawMetrics.coefficientOfVariation = qualityMetrics.CoefficientOfVariation;
result.rawMetrics.illuminationUniformity = qualityMetrics.IlluminationUniformity;
result.rawMetrics.validPixelFraction     = qualityMetrics.ValidPixelFraction;
result.rawMetrics.maskThreshold          = qualityMetrics.MaskThreshold;
result.rawMetrics.edgeDensity            = qualityMetrics.EdgeDensity;
result.rawMetrics.edgePixelCount         = qualityMetrics.EdgePixelCount;

% 0-100 component scores
result.componentScores = struct();
result.componentScores.brightnessIllumination = scores.BrightnessIllumination;
result.componentScores.contrast               = scores.Contrast;
result.componentScores.blurDetail             = scores.BlurDetail;
result.componentScores.edgeDetail             = scores.EdgeDetail;

% Fused score
result.overallQualityScore = fused.OverallQualityScore;

% Weights used
result.weightsUsed = struct();
availNames = fused.AvailableSignals;
for idx = 1:numel(availNames)
    result.weightsUsed.(availNames{idx}) = fused.WeightsUsed.(availNames{idx});
end

% Thresholds (from config, for frontend display)
result.thresholds = struct();
result.thresholds.foregroundBrightnessDarkMax = thresholds.ForegroundBrightnessDarkMax;
result.thresholds.contrastBlurryMax           = thresholds.ContrastBlurryMax;
result.thresholds.metadata = struct( ...
    'type', thresholds.Metadata.Type, ...
    'calibrationSamples', thresholds.Metadata.CalibrationSamples, ...
    'medicallyValidated', thresholds.Metadata.MedicallyValidated);

% Reference ranges used for scoring (from calculateQualityScores defaults)
result.referenceRanges = struct();
result.referenceRanges.meanBrightness         = [0.10, 0.60];
result.referenceRanges.illuminationUniformity = [0.60, 0.90];
result.referenceRanges.contrast               = [20, 90];
result.referenceRanges.blurScore              = [0.00005, 0.00200];
result.referenceRanges.edgeDensity            = [0.01, 0.25];

% Classification output
result.classification = struct();
result.classification.label      = classification.Label;
result.classification.confidence = classification.Confidence;
result.classification.reasons    = classification.Reasons;

% Final status and recommendation
result.overallStatus    = overallStatus;
result.recommendation   = recommendation;
result.pipelineVersion  = 'Phase2D-v1';
result.success          = true;

% Write JSON
try
    jsonStr = jsonencode(result);
    fid = fopen(outputJsonPath, 'w');
    if fid == -1
        error('runAnalysis:JsonWriteError', ...
            'Cannot open output JSON file for writing: %s', outputJsonPath);
    end
    fprintf(fid, '%s', jsonStr);
    fclose(fid);
catch jsonErr
    writeError(outputJsonPath, 'JSON_WRITE_ERROR', jsonErr.message);
    exit(1);
end

exit(0);
end

% ------------------------------------------------------------------
% Helper: write a structured error JSON and return
% ------------------------------------------------------------------
function writeError(outputJsonPath, errorCode, errorMessage)
errResult = struct( ...
    'success',      false, ...
    'errorCode',    errorCode, ...
    'errorMessage', errorMessage);
try
    jsonStr = jsonencode(errResult);
    fid = fopen(outputJsonPath, 'w');
    if fid ~= -1
        fprintf(fid, '%s', jsonStr);
        fclose(fid);
    end
catch
    % If we can't even write JSON, there's nothing left to do.
end
end
