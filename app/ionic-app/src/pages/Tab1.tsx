import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/react";
import { testApiService } from "../app/test-api";
import ExploreContainer from "../components/ExploreContainer";
import "./Tab1.css";

const Tab1: React.FC = () => {
  const handleTestApi = async () => {
    console.clear(); // Clear console for better readability
    console.log("🧪 Manual API Service Test Started...");
    await testApiService();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Driver Drowsiness Detection</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Driver Drowsiness Detection</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>🧪 API Service Testing</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Test the API Service connection and mock data functionality.</p>
            <IonButton
              expand="block"
              fill="solid"
              color="primary"
              onClick={handleTestApi}
            >
              🚀 Run API Service Tests
            </IonButton>
            <p
              style={{
                fontSize: "0.9em",
                color: "var(--ion-color-medium)",
                marginTop: "1rem",
              }}
            >
              Open Developer Console (F12) to see detailed test results.
            </p>
          </IonCardContent>
        </IonCard>

        <ExploreContainer name="Phase 2: Core Development" />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
