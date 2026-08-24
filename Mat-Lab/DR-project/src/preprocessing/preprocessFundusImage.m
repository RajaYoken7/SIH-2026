function processed = preprocessFundusImage(inputImage)
%PREPROCESSFUNDUSIMAGE Standardize and enhance a fundus image.
%   PROCESSED = PREPROCESSFUNDUSIMAGE(INPUTIMAGE) accepts an image path or
%   an image array and returns the resized original, grayscale image, and
%   CLAHE-enhanced grayscale image.

if ischar(inputImage) || (isstring(inputImage) && isscalar(inputImage))
    imagePath = char(inputImage);
    if ~isfile(imagePath)
        error('preprocessFundusImage:FileNotFound', ...
            'Image file was not found: %s', imagePath);
    end
    originalImage = imread(imagePath);
    sourcePath = imagePath;
elseif isnumeric(inputImage) || islogical(inputImage)
    originalImage = inputImage;
    sourcePath = '';
else
    error('preprocessFundusImage:InvalidInput', ...
        'Input must be an image path or a numeric/logical image array.');
end

if isempty(originalImage) || ndims(originalImage) > 3
    error('preprocessFundusImage:InvalidImage', ...
        'Input image must be a non-empty 2-D grayscale or 3-D RGB image.');
end

if ndims(originalImage) == 3 && size(originalImage, 3) ~= 3
    error('preprocessFundusImage:UnsupportedChannels', ...
        'Color input must have exactly three channels.');
end

resizedImage = imresize(originalImage, [512 512]);
if ndims(resizedImage) == 3
    grayImage = rgb2gray(resizedImage);
else
    grayImage = resizedImage;
end

grayImage = im2uint8(grayImage);
enhancedImage = adapthisteq(grayImage);

processed = struct( ...
    'Original', resizedImage, ...
    'Gray', grayImage, ...
    'Enhanced', enhancedImage, ...
    'SourcePath', sourcePath);
end
