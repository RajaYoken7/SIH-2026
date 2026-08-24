function metrics = calculateIlluminationMetrics(grayImage)
%CALCULATEILLUMINATIONMETRICS Measure brightness and illumination evenness.
%   METRICS = CALCULATEILLUMINATIONMETRICS(GRAYIMAGE) returns illumination
%   measurements for a non-empty 2-D grayscale image. Black background
%   outside the fundus field is excluded using a relative intensity mask.
%
%   MeanBrightness and BrightnessStd describe the pixel intensities inside
%   the valid retinal-region mask, on a 0-to-1 scale. CoefficientOfVariation
%   is BrightnessStd divided by MeanBrightness. IlluminationUniformity is
%   mean(smoothed illumination) / (mean(smoothed illumination) + standard
%   deviation of smoothed illumination), so larger values indicate a more
%   even illumination field. It is not a clinical score or threshold.

if ~(isnumeric(grayImage) || islogical(grayImage)) || ...
        ndims(grayImage) ~= 2 || isempty(grayImage)
    error('calculateIlluminationMetrics:InvalidInput', ...
        'Input must be a non-empty 2-D grayscale image.');
end

imageAsDouble = im2double(grayImage);
[validMask, maskThreshold] = createFundusRegionMask(imageAsDouble);

validPixels = imageAsDouble(validMask);
meanBrightness = mean(validPixels);
brightnessStd = std(validPixels);

% Smooth away vessel/detail variation so this statistic reflects broad
% illumination changes more than local anatomical edges.
illuminationField = imgaussfilt(imageAsDouble, 15);
fieldPixels = illuminationField(validMask);
fieldMean = mean(fieldPixels);
fieldStd = std(fieldPixels);

metrics = struct();
metrics.MeanBrightness = meanBrightness;
metrics.BrightnessStd = brightnessStd;
metrics.CoefficientOfVariation = brightnessStd / max(meanBrightness, eps);
metrics.IlluminationUniformity = fieldMean / max(fieldMean + fieldStd, eps);
metrics.ValidPixelFraction = nnz(validMask) / numel(validMask);
metrics.MaskThreshold = maskThreshold;
end
