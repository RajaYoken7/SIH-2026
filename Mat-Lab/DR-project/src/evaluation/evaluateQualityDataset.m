function evaluation = evaluateQualityDataset(dataFolder, referenceRanges, weights)
%EVALUATEQUALITYDATASET Process all GOOD/BAD images and existing signals.
%   EVALUATION = EVALUATEQUALITYDATASET(DATAFOLDER) discovers files named
%   <id>_good or <id>_bad, processes every image with the existing metric
%   functions, and calculates the existing prototype component/fused scores.
%   Optional reference ranges and weights are passed to Phase 2D unchanged.

if nargin < 1 || ~isfolder(dataFolder)
    error('evaluateQualityDataset:InvalidFolder', ...
        'A valid dataset folder is required.');
end
if nargin < 2
    referenceRanges = [];
end
if nargin < 3
    weights = [];
end

allFiles = dir(dataFolder);
fileNames = {allFiles(~[allFiles.isdir]).name};
goodFiles = selectQualityFiles(fileNames, 'good');
badFiles = selectQualityFiles(fileNames, 'bad');
if isempty(goodFiles) && isempty(badFiles)
    error('evaluateQualityDataset:NoQualityFiles', ...
        'No *_good or *_bad image files were found in %s.', dataFolder);
end

records = struct('FileName', {}, 'FilePath', {}, 'Group', {}, 'PairId', {}, ...
    'Metrics', {}, 'Scores', {}, 'OverallQualityScore', {});
records = appendRecords(records, goodFiles, 'GOOD', dataFolder, referenceRanges, weights);
records = appendRecords(records, badFiles, 'BAD', dataFolder, referenceRanges, weights);

pairIds = unique({records.PairId});
pairs = struct('PairId', {}, 'GoodFile', {}, 'BadFile', {}, ...
    'GoodScore', {}, 'BadScore', {});
for index = 1:numel(pairIds)
    pairRecords = records(strcmp({records.PairId}, pairIds{index}));
    goodIndex = find(strcmp({pairRecords.Group}, 'GOOD'), 1);
    badIndex = find(strcmp({pairRecords.Group}, 'BAD'), 1);
    if ~isempty(goodIndex) && ~isempty(badIndex)
        pair = struct();
        pair.PairId = pairIds{index};
        pair.GoodFile = pairRecords(goodIndex).FileName;
        pair.BadFile = pairRecords(badIndex).FileName;
        pair.GoodScore = pairRecords(goodIndex).OverallQualityScore;
        pair.BadScore = pairRecords(badIndex).OverallQualityScore;
        pairs(end + 1) = pair;
    end
end

evaluation = struct();
evaluation.DataFolder = dataFolder;
evaluation.Records = records;
evaluation.Pairs = pairs;
evaluation.GoodCount = sum(strcmp({records.Group}, 'GOOD'));
evaluation.BadCount = sum(strcmp({records.Group}, 'BAD'));
evaluation.DiscoveredFiles = fileNames;
end

function records = appendRecords(records, fileNames, groupName, dataFolder, referenceRanges, weights)
for index = 1:numel(fileNames)
    fileName = fileNames{index};
    imagePath = fullfile(dataFolder, fileName);
    processed = preprocessFundusImage(imagePath);
    baseMetrics = calculateQualityMetrics(processed.Gray);
    illumination = calculateIlluminationMetrics(processed.Gray);
    edgeMetrics = calculateEdgeDensity(processed.Gray);
    baseMetrics.MeanBrightness = illumination.MeanBrightness;
    baseMetrics.BrightnessStd = illumination.BrightnessStd;
    baseMetrics.CoefficientOfVariation = illumination.CoefficientOfVariation;
    baseMetrics.IlluminationUniformity = illumination.IlluminationUniformity;
    baseMetrics.EdgeDensity = edgeMetrics.EdgeDensity;
    scores = calculateQualityScores(baseMetrics, referenceRanges);
    fused = fuseQualityScores(scores, weights);

    record = struct();
    record.FileName = fileName;
    record.FilePath = imagePath;
    record.Group = groupName;
    record.PairId = qualityPairId(fileName);
    record.Metrics = baseMetrics;
    record.Scores = scores;
    record.OverallQualityScore = fused.OverallQualityScore;
    records(end + 1) = record;
end
end

function selectedNames = selectQualityFiles(fileNames, qualityLabel)
pattern = ['^(.*)_' qualityLabel '\.(jpg|jpeg|png|tif|tiff)$'];
selected = false(size(fileNames));
for index = 1:numel(fileNames)
    selected(index) = ~isempty(regexpi(fileNames{index}, pattern, 'once'));
end
selectedNames = sort(fileNames(selected));
end

function pairId = qualityPairId(fileName)
tokens = regexp(fileName, '^(.*)_(good|bad)\.[^.]+$', 'tokens', 'once', 'ignorecase');
if isempty(tokens)
    pairId = fileName;
else
    pairId = tokens{1};
end
end
