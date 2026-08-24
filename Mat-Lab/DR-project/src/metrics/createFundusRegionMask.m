function [validMask, maskThreshold] = createFundusRegionMask(grayImage)
%CREATEFUNDUSREGIONMASK Identify pixels inside the non-black fundus field.
%   [VALIDMASK, MASKTHRESHOLD] = CREATEFUNDUSREGIONMASK(GRAYIMAGE) returns
%   a mask that excludes the black background outside the retinal field.
%   The threshold is relative to the image maximum, with a small floor to
%   reject near-black background pixels.

if ~(isnumeric(grayImage) || islogical(grayImage)) || ...
        ndims(grayImage) ~= 2 || isempty(grayImage)
    error('createFundusRegionMask:InvalidInput', ...
        'Input must be a non-empty 2-D grayscale image.');
end

imageAsDouble = im2double(grayImage);
maximumIntensity = max(imageAsDouble(:));
maskThreshold = max(0.02, 0.05 * maximumIntensity);
validMask = imageAsDouble > maskThreshold;

if ~any(validMask(:))
    error('createFundusRegionMask:NoValidRegion', ...
        'The image contains no pixels above the retinal-region mask threshold.');
end
end
