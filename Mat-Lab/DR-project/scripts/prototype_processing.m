% Get the project root folder
projectFolder = fileparts(fileparts(mfilename('fullpath')));

% Path to the fundus image
imagePath = fullfile(projectFolder, 'data','allQuality/', '18_bad.JPG');

% Read the image
img = imread(imagePath);

% Standardize image size
img = imresize(img, [512 512]);

% Display image
% Convert image to grayscale for enhancement analysis
grayImg = rgb2gray(img);

% Apply CLAHE contrast enhancement
enhancedImg = adapthisteq(grayImg);

% Display original and enhanced images
figure;

subplot(1,2,1);
imshow(grayImg);
title('Original Grayscale');

subplot(1,2,2);
imshow(enhancedImg);
title('CLAHE Enhanced Image');

%% Image Quality Assessment

% Calculate brightness (average pixel intensity)
brightness = mean(grayImg(:));

% Calculate contrast (standard deviation of pixel intensity)
contrastValue = std(double(grayImg(:)));

% Calculate sharpness using Laplacian variance
laplacianFilter = fspecial('laplacian', 0.2);
laplacianImg = imfilter(double(grayImg), laplacianFilter, 'replicate');
sharpness = var(laplacianImg(:));

% Display the quality metrics
fprintf('\n--- IMAGE QUALITY ASSESSMENT ---\n');
fprintf('Brightness: %.2f\n', brightness);
fprintf('Contrast: %.2f\n', contrastValue);
fprintf('Sharpness: %.2f\n', sharpness);