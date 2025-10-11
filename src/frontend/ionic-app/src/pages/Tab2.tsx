import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import "./Tab2.css";
import CameraTest from "../components/CameraTest";

const Tab2: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Camera Testing</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Camera Testing</IonTitle>
          </IonToolbar>
        </IonHeader>

        <CameraTest />
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
