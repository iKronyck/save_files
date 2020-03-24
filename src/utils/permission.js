import {Platform, Alert} from 'react-native';
import Permissions, {openSettings} from 'react-native-permissions';

const isAndroidPlatform = () => {
  return Platform.OS === 'android';
};

export const getStoragePermission = async () => {
  let storage = 'android.permission.WRITE_EXTERNAL_STORAGE';
  if (!isAndroidPlatform()) {
    storage = 'ios.permission.PHOTO_LIBRARY';
  }
  const isEnabled = await checkPermission(storage);
  return isEnabled;
};

const checkPermission = async permission => {
  const verifyPermission = await Permissions.check(permission);
  if (verifyPermission === 'granted') {
    return true;
  } else if (verifyPermission === 'denied') {
    return await getPermission(permission);
  } else if (verifyPermission === 'blocked') {
    Alert.alert(
      'Blocked Storage Permission',
      'Save files need storage permission to download file, Please open settings and enable this permission.',
      [
        {
          text: 'Open settings',
          onPress: () => openSettings(),
        },
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
      ],
    );
    return false;
  } else {
    Alert.alert('Error', 'Unavailable access the storage', [
      {text: 'OK', onPress: () => {}},
      {text: 'Cancel', style: 'cancel'},
    ]);
    return false;
  }
};

const getPermission = async permission => {
  const check = await Permissions.request(permission);
  if (check === 'granted') {
    return true;
  } else if (check === 'denied' || check === 'blocked') {
    Alert.alert(
      'Denied Storage Permission',
      'Save files need storage permission to download file.',
      [
        {text: 'OK', onPress: () => {}},
        {text: 'Cancel', style: 'cancel', onPress: () => {}},
      ],
    );
    return false;
  } else {
    Alert.alert('Error', 'Unavailable access the storage', [
      {text: 'OK', onPress: () => {}},
      {text: 'Cancel', style: 'cancel'},
    ]);
    return false;
  }
};
