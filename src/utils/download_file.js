import {Platform, Alert} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import Share from 'react-native-share';
import {ImageBase64, PDFBase64, ExcelBase64} from './base64_files_test';
import {getStoragePermission} from './permission';
const {PictureDir, DCIMDir} = RNFetchBlob.fs.dirs;
const folderName = 'SaveFiles';

export const downloadFile = async (type, base64File, fileName) => {
  let mime = '';
  let extensionFile = '';
  let folder_to_save = DCIMDir;
  if (type === 'image') {
    mime = 'image/png';
    extensionFile = 'png';
    base64File = ImageBase64;
    folder_to_save = PictureDir;
  } else if (type === 'pdf') {
    mime = 'application/pdf';
    extensionFile = 'pdf';
    base64File = PDFBase64;
  } else {
    mime = 'text/csv';
    extensionFile = 'csv';
    base64File = ExcelBase64;
  }
  let path = `${folder_to_save}/${folderName}/${fileName}.${extensionFile}`;
  const storagePermission = await getStoragePermission();
  if (storagePermission) {
    if (Platform.OS === 'android') {
      downloadAndroid(base64File, mime, path);
    } else {
      downloadIOS(mime, base64File);
    }
  }
};

const downloadIOS = (mime, file) => {
  Share.open({
    url: `data:${mime};base64,${file}`,
  });
};

const downloadAndroid = async (file, mime, path) => {
  await RNFetchBlob.fs.writeFile(path, file, 'base64');
  await RNFetchBlob.android.addCompleteDownload({
    description: 'Download File',
    title: 'File downloaded success',
    showNotification: true,
    mime,
    path,
  });
  Alert.alert(
    'Download Success',
    'Go to your notifications for open the file.',
    [
      {text: 'OK', onPress: () => {}},
      {text: 'Cancel', style: 'cancel', onPress: () => {}},
    ],
  );
};
