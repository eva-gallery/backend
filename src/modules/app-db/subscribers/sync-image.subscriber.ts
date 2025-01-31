import { Injectable, Logger } from '@nestjs/common';
import { EventSubscriber, EntitySubscriberInterface, Connection, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';
import { MessengerService } from '@modules/messenger';
import { Artwork, Artist } from '../entities';

@Injectable()
@EventSubscriber()
export class SyncImageSubscriber implements EntitySubscriberInterface<any> {

  private readonly logger = new Logger(SyncImageSubscriber.name);

  constructor(connection: Connection, private messenger: MessengerService) {
    connection.subscribers.push(this);
  }

  afterInsert(event: InsertEvent<any>) {
    this.handleEvent(event);
  }

  afterUpdate(event: UpdateEvent<any>) {
    this.handleEvent(event);
  }

  afterRemove(event: RemoveEvent<any>) {
    this.handleEvent(event);
  }

  private handleEvent(event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>) {
    if (this.isValidEvent(event)) {
      const entityType = event.metadata.targetName;
      const entityId = event.entity.id;
      this.logger.log(`Starting synchronization for ${entityType} with ID ${entityId}`);
      this.messenger.sendMessage({ type: "ResyncImageMessage" });
      this.logger.log(`Finished synchronization for ${entityType} with ID ${entityId}`);
    }
  }

  private isValidEvent(event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>) {
    const target = event.metadata?.target;
    return event.entity != null && ((target === Artwork) || (target === Artist));
  }

}
