%RUN_PHASE2A_BLUR_DETECTION Compare blur scores on one quality-labelled pair.

projectRoot = fileparts(fileparts(mfilename('fullpath')));
addpath(genpath(fullfile(projectRoot, 'src')));

dataFolder = fullfile(projectRoot, 'data', 'allQuality');
fileNames = {'1_good.JPG', '1_bad.JPG'};
blurScores = zeros(size(fileNames));

fprintf('\nPHASE 2A - BLUR VALIDATION\n');
fprintf('==========================\n');
fprintf('BlurScore is variance of the Laplacian; higher means sharper.\n');
fprintf(['Initial two-image comparison only. The quality label is not treated ', ...
    'as a blur label.\n']);
fprintf(['A full dataset evaluation is required before choosing a production ', ...
    'threshold.\n\n']);
for index = 1:numel(fileNames)
    imagePath = fullfile(dataFolder, fileNames{index});
    if ~isfile(imagePath)
        error('run_phase2a_blur_detection:FileNotFound', ...
            'Expected dataset image was not found: %s', imagePath);
    end
    processed = preprocessFundusImage(imagePath);
    metrics = calculateQualityMetrics(processed.Gray);
    blurScores(index) = metrics.BlurScore;
    fprintf('%s -> Blur Score: %.8f\n', fileNames{index}, blurScores(index));
end

if blurScores(1) > blurScores(2)
    higherFile = fileNames{1};
    lowerFile = fileNames{2};
elseif blurScores(2) > blurScores(1)
    higherFile = fileNames{2};
    lowerFile = fileNames{1};
else
    higherFile = '';
    lowerFile = '';
end

fprintf('\nObservation:\n');
if isempty(higherFile)
    fprintf('Both images have the same measured Blur Score.\n');
else
    fprintf('Higher score (sharper/detail-rich): %s\n', higherFile);
    fprintf('Lower score (more blur-like): %s\n', lowerFile);
end
fprintf('The metric independently measures image detail; visual review is still required.\n');
